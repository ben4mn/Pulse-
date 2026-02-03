export type Platform = 'hn' | 'reddit' | 'substack' | 'twitter' | 'threads';

export interface FeedItem {
  id: string;
  platform: Platform;
  title?: string;
  body?: string;
  url?: string;
  author: string;
  timestamp: number;
  score?: number;
  commentCount?: number;
  thumbnail?: string;
  subreddit?: string;
  publication?: string;
  tags?: string[];
  summary?: string;
  aiScore?: number;
}

export interface Comment {
  id: string;
  platform: Platform;
  author: string;
  body: string;
  timestamp: number;
  score?: number;
  depth: number;
  children: Comment[];
  collapsed?: boolean;
}

export interface Article {
  title: string;
  content: string;
  url: string;
  wordCount: number;
  readingTime: number;
}

export interface FeedResult {
  items: FeedItem[];
  hasMore: boolean;
  cursor?: string;
}

export interface ProviderConfig {
  enabled: boolean;
  [key: string]: unknown;
}
