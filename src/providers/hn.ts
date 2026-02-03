import type { FeedProvider } from './base';
import type { FeedItem, FeedResult, Comment } from './types';
import { sessionCache } from '../services/cache';

const BASE = 'https://hacker-news.firebaseio.com/v0';
const BATCH_SIZE = 30;
const MAX_CONCURRENT = 15;
const LIST_TTL = 2 * 60 * 1000;
const ITEM_TTL = 5 * 60 * 1000;

interface HNItem {
  id: number;
  type: string;
  by?: string;
  time?: number;
  title?: string;
  text?: string;
  url?: string;
  score?: number;
  descendants?: number;
  kids?: number[];
  dead?: boolean;
  deleted?: boolean;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HN API error: ${res.status}`);
  return res.json();
}

async function fetchItem(id: number): Promise<HNItem | null> {
  const cacheKey = `hn_item_${id}`;
  const cached = sessionCache.get<HNItem>(cacheKey, ITEM_TTL);
  if (cached) return cached;

  const item = await fetchJSON<HNItem>(`${BASE}/item/${id}.json`);
  if (item) sessionCache.set(cacheKey, item);
  return item;
}

async function fetchBatch(ids: number[]): Promise<HNItem[]> {
  // Fetch in chunks to limit concurrency
  const results = new Map<number, HNItem>();

  for (let i = 0; i < ids.length; i += MAX_CONCURRENT) {
    const chunk = ids.slice(i, i + MAX_CONCURRENT);
    const items = await Promise.all(
      chunk.map((id) => fetchItem(id).catch(() => null)),
    );
    for (const item of items) {
      if (item && !item.dead && !item.deleted) {
        results.set(item.id, item);
      }
    }
  }

  // Preserve original order
  return ids.map((id) => results.get(id)).filter(Boolean) as HNItem[];
}

function toFeedItem(item: HNItem): FeedItem {
  return {
    id: `hn_${item.id}`,
    platform: 'hn',
    title: item.title,
    body: item.text,
    url: item.url,
    author: item.by ?? '[deleted]',
    timestamp: (item.time ?? 0) * 1000,
    score: item.score,
    commentCount: item.descendants,
  };
}

async function fetchComments(parentId: number, depth: number = 0, maxDepth: number = 3): Promise<Comment[]> {
  const item = await fetchItem(parentId);
  if (!item?.kids?.length) return [];

  const children = await fetchBatch(item.kids);
  const comments: Comment[] = [];

  for (const child of children) {
    if (child.dead || child.deleted || child.type !== 'comment') continue;
    const comment: Comment = {
      id: `hn_${child.id}`,
      platform: 'hn',
      author: child.by ?? '[deleted]',
      body: child.text ?? '',
      timestamp: (child.time ?? 0) * 1000,
      depth,
      children: depth < maxDepth && child.kids?.length
        ? await fetchComments(child.id, depth + 1, maxDepth)
        : [],
    };
    comments.push(comment);
  }
  return comments;
}

export const hnProvider: FeedProvider = {
  platform: 'hn',

  async fetchFeed(filter: string, page: number): Promise<FeedResult> {
    const type = filter || 'top';
    const cacheKey = `hn_${type}_list`;
    let ids = sessionCache.get<number[]>(cacheKey, LIST_TTL);

    if (!ids) {
      ids = await fetchJSON<number[]>(`${BASE}/${type}stories.json`);
      sessionCache.set(cacheKey, ids);
    }

    const start = page * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    const pageIds = ids.slice(start, end);
    const items = await fetchBatch(pageIds);

    return {
      items: items.map(toFeedItem),
      hasMore: end < ids.length,
    };
  },

  async fetchComments(itemId: string): Promise<Comment[]> {
    const numId = parseInt(itemId.replace('hn_', ''), 10);
    return fetchComments(numId, 0, 3);
  },
};
