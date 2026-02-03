import type { FeedItem, FeedResult, Comment } from './types';

export interface FeedProvider {
  readonly platform: FeedItem['platform'];
  fetchFeed(filter: string, page: number): Promise<FeedResult>;
  fetchComments?(itemId: string): Promise<Comment[]>;
  fetchArticle?(url: string): Promise<string>;
}
