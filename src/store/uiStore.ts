import { create } from 'zustand';
import type { Platform } from '../providers/types';

type Tab = Platform | 'pulse';

interface RateLimitEvent {
  timestamp: number;
  endpoint: string;
}

interface UIState {
  activeTab: Tab;
  darkMode: boolean;
  settingsOpen: boolean;
  feedScrollPositions: Record<string, number>;
  redditRateLimited: boolean;
  redditRateLimitHits: RateLimitEvent[];
  setActiveTab: (tab: Tab) => void;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  setSettingsOpen: (open: boolean) => void;
  saveFeedScroll: (tab: string, y: number) => void;
  getFeedScroll: (tab: string) => number;
  setRedditRateLimited: (endpoint: string) => void;
  dismissRedditRateLimit: () => void;
}

function getInitialDarkMode(): boolean {
  const stored = localStorage.getItem('pulse-dark');
  if (stored !== null) return stored === 'true';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const useUIStore = create<UIState>()((set, get) => ({
  activeTab: 'hn',
  darkMode: getInitialDarkMode(),
  settingsOpen: false,
  feedScrollPositions: {},
  redditRateLimited: false,
  redditRateLimitHits: [],
  setActiveTab: (tab) => set({ activeTab: tab }),
  setDarkMode: (dark) => {
    localStorage.setItem('pulse-dark', String(dark));
    set({ darkMode: dark });
  },
  toggleDarkMode: () => {
    const next = !get().darkMode;
    localStorage.setItem('pulse-dark', String(next));
    set({ darkMode: next });
  },
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  saveFeedScroll: (tab, y) => set((s) => ({
    feedScrollPositions: { ...s.feedScrollPositions, [tab]: y },
  })),
  getFeedScroll: (tab) => get().feedScrollPositions[tab] ?? 0,
  setRedditRateLimited: (endpoint) => set((s) => ({
    redditRateLimited: true,
    redditRateLimitHits: [...s.redditRateLimitHits, { timestamp: Date.now(), endpoint }],
  })),
  dismissRedditRateLimit: () => set({ redditRateLimited: false }),
}));
