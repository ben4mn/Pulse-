import type { FeedProvider } from './base';
import type { FeedItem, FeedResult } from './types';
import { sessionCache } from '../services/cache';

const LIST_TTL = 5 * 60 * 1000;

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  description: string;
  content: string;
}

function parseRSS(xml: string): RSSItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = doc.querySelectorAll('item');
  const results: RSSItem[] = [];

  items.forEach((item) => {
    const getText = (tag: string) => item.querySelector(tag)?.textContent ?? '';
    // dc:creator uses namespace — try both
    const creator = item.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', 'creator')[0]?.textContent
      ?? getText('author') ?? '';

    results.push({
      title: getText('title'),
      link: getText('link'),
      pubDate: getText('pubDate'),
      creator,
      description: getText('description'),
      content: item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0]?.textContent
        ?? getText('description'),
    });
  });
  return results;
}

function extractPublication(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('.substack.com', '').replace('www.', '');
  } catch {
    return url;
  }
}

function toFeedItem(rssItem: RSSItem, feedUrl: string): FeedItem {
  const publication = extractPublication(feedUrl);
  return {
    id: `substack_${btoa(rssItem.link).slice(0, 32)}`,
    platform: 'substack',
    title: rssItem.title,
    body: rssItem.description?.slice(0, 200),
    url: rssItem.link,
    author: rssItem.creator || publication,
    timestamp: new Date(rssItem.pubDate).getTime(),
    publication,
  };
}

export const substackProvider: FeedProvider = {
  platform: 'substack',

  async fetchFeed(filter: string, _page: number): Promise<FeedResult> {
    // filter = comma-separated list of substack URLs/slugs
    const publications = filter.split(',').map((s) => s.trim()).filter(Boolean);
    if (!publications.length) return { items: [], hasMore: false };

    const allItems: FeedItem[] = [];

    for (const pub of publications) {
      const feedUrl = pub.includes('.')
        ? `https://${pub}/feed`
        : `https://${pub}.substack.com/feed`;

      const cacheKey = `substack_${pub}`;
      let items = sessionCache.get<FeedItem[]>(cacheKey, LIST_TTL);

      if (!items) {
        try {
          // Use a CORS proxy for RSS feeds
          const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`);
          if (!res.ok) continue;
          const xml = await res.text();
          const rssItems = parseRSS(xml);
          items = rssItems.map((r) => toFeedItem(r, feedUrl));
          sessionCache.set(cacheKey, items);
        } catch {
          continue;
        }
      }
      allItems.push(...items);
    }

    // Sort by timestamp descending
    allItems.sort((a, b) => b.timestamp - a.timestamp);
    return { items: allItems, hasMore: false };
  },
};
