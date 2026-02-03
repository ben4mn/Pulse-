import type { FeedProvider } from './base';
import type { FeedItem, FeedResult } from './types';
import { sessionCache } from '../services/cache';

const LIST_TTL = 5 * 60 * 1000;

interface ThreadsPost {
  id: string;
  text?: string;
  timestamp: string;
  username: string;
  media_url?: string;
  like_count?: number;
  replies_count?: number;
  permalink?: string;
}

function toFeedItem(post: ThreadsPost): FeedItem {
  return {
    id: `threads_${post.id}`,
    platform: 'threads',
    body: post.text,
    url: post.permalink ?? `https://www.threads.net/@${post.username}/post/${post.id}`,
    author: post.username,
    timestamp: new Date(post.timestamp).getTime(),
    score: post.like_count,
    commentCount: post.replies_count,
    thumbnail: post.media_url,
  };
}

export const threadsProvider: FeedProvider = {
  platform: 'threads',

  async fetchFeed(filter: string, _page: number): Promise<FeedResult> {
    // filter = "token:keyword"
    const [token, ...keywordParts] = filter.split(':');
    const keyword = keywordParts.join(':');
    if (!token || !keyword) return { items: [], hasMore: false };

    const cacheKey = `threads_${keyword}`;
    let items = sessionCache.get<FeedItem[]>(cacheKey, LIST_TTL);

    if (!items) {
      try {
        const params = new URLSearchParams({
          q: keyword,
          fields: 'id,text,timestamp,username,media_url,like_count,permalink',
          access_token: token,
        });
        const res = await fetch(`https://graph.threads.net/v1.0/threads/search?${params}`);
        if (!res.ok) throw new Error(`Threads API error: ${res.status}`);
        const json = await res.json();
        items = (json.data ?? []).map(toFeedItem);
        sessionCache.set(cacheKey, items);
      } catch {
        return { items: [], hasMore: false };
      }
    }

    return { items: items ?? [], hasMore: false };
  },
};
