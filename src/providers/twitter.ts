import type { FeedProvider } from './base';
import type { FeedItem, FeedResult } from './types';
import { sessionCache } from '../services/cache';

const LIST_TTL = 2 * 60 * 1000;

interface TwitterAPITweet {
  id: string;
  text: string;
  createdAt: string;
  author: {
    userName: string;
    name: string;
    profilePicture?: string;
  };
  likeCount?: number;
  replyCount?: number;
  retweetCount?: number;
  quoteCount?: number;
  media?: Array<{ type: string; url: string }>;
}

function toFeedItem(tweet: TwitterAPITweet): FeedItem {
  return {
    id: `twitter_${tweet.id}`,
    platform: 'twitter',
    body: tweet.text,
    url: `https://x.com/${tweet.author.userName}/status/${tweet.id}`,
    author: tweet.author.userName,
    timestamp: new Date(tweet.createdAt).getTime(),
    score: (tweet.likeCount ?? 0) + (tweet.retweetCount ?? 0),
    commentCount: tweet.replyCount,
    thumbnail: tweet.media?.[0]?.url,
  };
}

export const twitterProvider: FeedProvider = {
  platform: 'twitter',

  async fetchFeed(filter: string, page: number): Promise<FeedResult> {
    // filter = username or search query
    // API key comes from settings store (passed via filter as "apiKey:query")
    const [apiKey, ...queryParts] = filter.split(':');
    const query = queryParts.join(':');
    if (!apiKey || !query) return { items: [], hasMore: false };

    const cacheKey = `twitter_${query}_${page}`;
    let items = sessionCache.get<FeedItem[]>(cacheKey, LIST_TTL);

    if (!items) {
      try {
        const res = await fetch('https://api.twitterapi.io/twitter/tweet/advanced_search', {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `from:${query}`,
            queryType: 'Latest',
            cursor: page > 0 ? sessionCache.get<string>(`twitter_cursor_${query}_${page}`, LIST_TTL) : undefined,
          }),
        });

        if (!res.ok) throw new Error(`Twitter API error: ${res.status}`);
        const json = await res.json();
        items = (json.tweets ?? []).map(toFeedItem);
        if (json.next_cursor) {
          sessionCache.set(`twitter_cursor_${query}_${page + 1}`, json.next_cursor);
        }
        sessionCache.set(cacheKey, items);
      } catch {
        return { items: [], hasMore: false };
      }
    }

    return { items: items ?? [], hasMore: items !== null && items.length >= 20 };
  },
};
