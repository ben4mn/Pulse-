import type { FeedProvider } from './base';
import type { FeedItem, FeedResult, Comment } from './types';
import { sessionCache } from '../services/cache';

const LIST_TTL = 2 * 60 * 1000;

export class RedditRateLimitError extends Error {
  endpoint: string;
  constructor(endpoint: string) {
    super('Reddit rate limit exceeded (429)');
    this.name = 'RedditRateLimitError';
    this.endpoint = endpoint;
  }
}

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext?: string;
    selftext_html?: string;
    url: string;
    permalink: string;
    author: string;
    created_utc: number;
    score: number;
    num_comments: number;
    subreddit: string;
    thumbnail?: string;
    is_self: boolean;
    link_flair_text?: string;
    preview?: { images?: Array<{ source: { url: string } }> };
  };
}

interface RedditComment {
  data: {
    id: string;
    author: string;
    body_html: string;
    body: string;
    created_utc: number;
    score: number;
    depth: number;
    replies?: { data?: { children?: RedditComment[] } } | '';
  };
  kind: string;
}

function decodeHtmlEntities(html: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
}

function getPreviewImage(post: RedditPost['data']): string | undefined {
  const src = post.preview?.images?.[0]?.source?.url;
  if (src) return decodeHtmlEntities(src);
  if (post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default' && post.thumbnail !== 'nsfw') {
    return post.thumbnail;
  }
  return undefined;
}

function toFeedItem(post: RedditPost): FeedItem {
  const d = post.data;
  return {
    id: `reddit_${d.id}`,
    platform: 'reddit',
    title: d.title,
    body: d.is_self ? d.selftext : undefined,
    url: d.is_self ? undefined : d.url,
    author: d.author,
    timestamp: d.created_utc * 1000,
    score: d.score,
    commentCount: d.num_comments,
    subreddit: d.subreddit,
    thumbnail: getPreviewImage(d),
    tags: d.link_flair_text ? [d.link_flair_text] : undefined,
  };
}

function flattenComments(children: RedditComment[], depth: number = 0): Comment[] {
  const results: Comment[] = [];
  for (const child of children) {
    if (child.kind !== 't1') continue;
    const d = child.data;
    const replies = typeof d.replies === 'object' && d.replies?.data?.children
      ? flattenComments(d.replies.data.children, depth + 1)
      : [];
    results.push({
      id: `reddit_${d.id}`,
      platform: 'reddit',
      author: d.author,
      body: d.body_html ? decodeHtmlEntities(d.body_html) : d.body,
      timestamp: d.created_utc * 1000,
      score: d.score,
      depth,
      children: replies,
    });
  }
  return results;
}

export const redditProvider: FeedProvider = {
  platform: 'reddit',

  async fetchFeed(filter: string, page: number): Promise<FeedResult> {
    // filter format: "subreddit:sort" e.g. "technology:hot"
    const [sub, sort = 'hot'] = filter.split(':');
    const after = page > 0 ? sessionCache.get<string>(`reddit_after_${sub}_${sort}_${page}`, LIST_TTL) : null;
    const params = new URLSearchParams({ limit: '25', raw_json: '1' });
    if (after) params.set('after', after);

    const url = `https://www.reddit.com/r/${sub}/${sort}.json?${params}`;
    const cacheKey = `reddit_feed_${sub}_${sort}_${page}`;
    let data = sessionCache.get<{ items: FeedItem[]; hasMore: boolean; after?: string }>(cacheKey, LIST_TTL);

    if (!data) {
      const res = await fetch(url);
      if (res.status === 429) throw new RedditRateLimitError(url);
      if (!res.ok) throw new Error(`Reddit API error: ${res.status}`);
      const json = await res.json();
      const posts: RedditPost[] = json.data.children.filter((c: { kind: string }) => c.kind === 't3');
      const items = posts.map(toFeedItem);
      const nextAfter = json.data.after as string | null;
      data = { items, hasMore: !!nextAfter, after: nextAfter ?? undefined };
      sessionCache.set(cacheKey, data);
      if (nextAfter) {
        sessionCache.set(`reddit_after_${sub}_${sort}_${page + 1}`, nextAfter);
      }
    }

    return { items: data.items, hasMore: data.hasMore };
  },

  async fetchComments(itemId: string): Promise<Comment[]> {
    const id = itemId.replace('reddit_', '');
    // We need subreddit — try to find it from the feed store
    const url = `https://www.reddit.com/comments/${id}.json?raw_json=1&limit=100`;
    const res = await fetch(url);
    if (res.status === 429) throw new RedditRateLimitError(url);
    if (!res.ok) throw new Error(`Reddit comments error: ${res.status}`);
    const json = await res.json();
    const commentListing = json[1];
    if (!commentListing?.data?.children) return [];
    return flattenComments(commentListing.data.children);
  },
};
