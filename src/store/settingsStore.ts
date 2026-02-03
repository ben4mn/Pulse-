import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  openaiKey: string;
  summariesEnabled: boolean;
  twitterApiKey: string;
  threadsToken: string;
  subreddits: string[];
  substacks: string[];
  twitterAccounts: string[];
  threadsKeywords: string[];
  hnFilter: 'top' | 'new' | 'best';
  setOpenaiKey: (key: string) => void;
  setSummariesEnabled: (enabled: boolean) => void;
  setTwitterApiKey: (key: string) => void;
  setThreadsToken: (token: string) => void;
  addSubreddit: (sub: string) => void;
  removeSubreddit: (sub: string) => void;
  addSubstack: (pub: string) => void;
  removeSubstack: (pub: string) => void;
  addTwitterAccount: (account: string) => void;
  removeTwitterAccount: (account: string) => void;
  addThreadsKeyword: (keyword: string) => void;
  removeThreadsKeyword: (keyword: string) => void;
  setHnFilter: (filter: 'top' | 'new' | 'best') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      openaiKey: '',
      summariesEnabled: false,
      twitterApiKey: '',
      threadsToken: '',
      subreddits: ['technology', 'programming', 'webdev'],
      substacks: [],
      twitterAccounts: [],
      threadsKeywords: [],
      hnFilter: 'top',
      setOpenaiKey: (key) => set({ openaiKey: key }),
      setSummariesEnabled: (enabled) => set({ summariesEnabled: enabled }),
      setTwitterApiKey: (key) => set({ twitterApiKey: key }),
      setThreadsToken: (token) => set({ threadsToken: token }),
      addSubreddit: (sub) => set((s) => ({
        subreddits: s.subreddits.includes(sub.toLowerCase()) ? s.subreddits : [...s.subreddits, sub.toLowerCase()],
      })),
      removeSubreddit: (sub) => set((s) => ({
        subreddits: s.subreddits.filter((r) => r !== sub),
      })),
      addSubstack: (pub) => set((s) => ({
        substacks: s.substacks.includes(pub) ? s.substacks : [...s.substacks, pub],
      })),
      removeSubstack: (pub) => set((s) => ({
        substacks: s.substacks.filter((p) => p !== pub),
      })),
      addTwitterAccount: (account) => set((s) => ({
        twitterAccounts: s.twitterAccounts.includes(account) ? s.twitterAccounts : [...s.twitterAccounts, account],
      })),
      removeTwitterAccount: (account) => set((s) => ({
        twitterAccounts: s.twitterAccounts.filter((a) => a !== account),
      })),
      addThreadsKeyword: (keyword) => set((s) => ({
        threadsKeywords: s.threadsKeywords.includes(keyword) ? s.threadsKeywords : [...s.threadsKeywords, keyword],
      })),
      removeThreadsKeyword: (keyword) => set((s) => ({
        threadsKeywords: s.threadsKeywords.filter((k) => k !== keyword),
      })),
      setHnFilter: (filter) => set({ hnFilter: filter }),
    }),
    { name: 'pulse-settings' },
  ),
);
