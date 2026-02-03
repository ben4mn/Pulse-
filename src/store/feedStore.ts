import { create } from 'zustand';
import type { FeedItem, Comment } from '../providers/types';

interface FeedState {
  items: FeedItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  comments: Comment[];
  commentsLoading: boolean;
  currentItem: FeedItem | null;
  articleContent: string | null;
  articleLoading: boolean;
  setItems: (items: FeedItem[]) => void;
  appendItems: (items: FeedItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  setComments: (comments: Comment[]) => void;
  setCommentsLoading: (loading: boolean) => void;
  setCurrentItem: (item: FeedItem | null) => void;
  setArticleContent: (content: string | null) => void;
  setArticleLoading: (loading: boolean) => void;
  updateItemSummary: (id: string, summary: string) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>()((set) => ({
  items: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 0,
  comments: [],
  commentsLoading: false,
  currentItem: null,
  articleContent: null,
  articleLoading: false,
  setItems: (items) => set({ items }),
  appendItems: (items) => set((s) => ({ items: [...s.items, ...items] })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setHasMore: (hasMore) => set({ hasMore }),
  setPage: (page) => set({ page }),
  setComments: (comments) => set({ comments }),
  setCommentsLoading: (loading) => set({ commentsLoading: loading }),
  setCurrentItem: (item) => set({ currentItem: item }),
  setArticleContent: (content) => set({ articleContent: content }),
  setArticleLoading: (loading) => set({ articleLoading: loading }),
  updateItemSummary: (id, summary) => set((s) => ({
    items: s.items.map((item) => item.id === id ? { ...item, summary } : item),
  })),
  reset: () => set({
    items: [],
    loading: false,
    error: null,
    hasMore: true,
    page: 0,
    comments: [],
    commentsLoading: false,
    currentItem: null,
    articleContent: null,
    articleLoading: false,
  }),
}));
