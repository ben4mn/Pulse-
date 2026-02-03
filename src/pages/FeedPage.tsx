import { useEffect, useCallback } from 'react';
import { useFeedStore } from '../store/feedStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUIStore } from '../store/uiStore';
import { FeedList } from '../components/feed/FeedList';
import { PullToRefresh } from '../components/layout/PullToRefresh';
import { hnProvider } from '../providers/hn';
import { redditProvider, RedditRateLimitError } from '../providers/reddit';
import { substackProvider } from '../providers/substack';
import { twitterProvider } from '../providers/twitter';
import { threadsProvider } from '../providers/threads';
import { mixFeeds } from '../services/feedMixer';
import { autoGenerateSummaries, cancelAutoGenerate } from '../services/summaries';
import { sessionCache } from '../services/cache';
import type { FeedItem } from '../providers/types';

export function FeedPage() {
  const { items, loading, hasMore, page, setItems, appendItems, setLoading, setError, setHasMore, setPage, updateItemSummary, reset } = useFeedStore();
  const { activeTab, setRedditRateLimited } = useUIStore();
  const settings = useSettingsStore();

  const loadFeed = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      let newItems: FeedItem[] = [];

      if (activeTab === 'hn') {
        const result = await hnProvider.fetchFeed(settings.hnFilter, pageNum);
        newItems = result.items;
        setHasMore(result.hasMore);
      } else if (activeTab === 'reddit') {
        const results = await Promise.all(
          settings.subreddits.map((sub) => redditProvider.fetchFeed(`${sub}:hot`, pageNum).catch((err) => {
            if (err instanceof RedditRateLimitError) setRedditRateLimited(err.endpoint);
            return { items: [], hasMore: false };
          })),
        );
        newItems = results.flatMap((r) => r.items);
        newItems.sort((a, b) => b.timestamp - a.timestamp);
        setHasMore(results.some((r) => r.hasMore));
      } else if (activeTab === 'substack') {
        const result = await substackProvider.fetchFeed(settings.substacks.join(','), pageNum);
        newItems = result.items;
        setHasMore(result.hasMore);
      } else if (activeTab === 'twitter') {
        if (!settings.twitterApiKey) {
          newItems = [];
          setHasMore(false);
        } else {
          const results = await Promise.all(
            settings.twitterAccounts.map((acct) =>
              twitterProvider.fetchFeed(`${settings.twitterApiKey}:${acct}`, pageNum).catch(() => ({ items: [], hasMore: false }))),
          );
          newItems = results.flatMap((r) => r.items);
          newItems.sort((a, b) => b.timestamp - a.timestamp);
          setHasMore(results.some((r) => r.hasMore));
        }
      } else if (activeTab === 'threads') {
        if (!settings.threadsToken) {
          newItems = [];
          setHasMore(false);
        } else {
          const results = await Promise.all(
            settings.threadsKeywords.map((kw) =>
              threadsProvider.fetchFeed(`${settings.threadsToken}:${kw}`, pageNum).catch(() => ({ items: [], hasMore: false }))),
          );
          newItems = results.flatMap((r) => r.items);
          newItems.sort((a, b) => b.timestamp - a.timestamp);
          setHasMore(results.some((r) => r.hasMore));
        }
      } else if (activeTab === 'pulse') {
        // Unified feed: fetch from all enabled sources
        const feeds: FeedItem[][] = [];

        // Always include HN
        try {
          const hn = await hnProvider.fetchFeed(settings.hnFilter, 0);
          feeds.push(hn.items);
        } catch { /* skip */ }

        // Reddit if subreddits configured
        if (settings.subreddits.length > 0) {
          try {
            const rResults = await Promise.all(
              settings.subreddits.slice(0, 3).map((sub) =>
                redditProvider.fetchFeed(`${sub}:hot`, 0).catch((err) => {
                  if (err instanceof RedditRateLimitError) setRedditRateLimited(err.endpoint);
                  return { items: [], hasMore: false };
                })),
            );
            feeds.push(rResults.flatMap((r) => r.items));
          } catch { /* skip */ }
        }

        // Substack if publications configured
        if (settings.substacks.length > 0) {
          try {
            const sub = await substackProvider.fetchFeed(settings.substacks.join(','), 0);
            feeds.push(sub.items);
          } catch { /* skip */ }
        }

        // Twitter if API key configured
        if (settings.twitterApiKey && settings.twitterAccounts.length > 0) {
          try {
            const tResults = await Promise.all(
              settings.twitterAccounts.slice(0, 3).map((acct) =>
                twitterProvider.fetchFeed(`${settings.twitterApiKey}:${acct}`, 0).catch(() => ({ items: [], hasMore: false }))),
            );
            feeds.push(tResults.flatMap((r) => r.items));
          } catch { /* skip */ }
        }

        newItems = mixFeeds(feeds);
        setHasMore(false); // Unified doesn't paginate simply
      }

      if (append) {
        appendItems(newItems);
      } else {
        setItems(newItems);
      }
      setPage(pageNum);

      // Auto-generate summaries if enabled
      if (settings.summariesEnabled && settings.openaiKey) {
        const allItems = append ? [...items, ...newItems] : newItems;
        autoGenerateSummaries(allItems, settings.openaiKey, updateItemSummary);
      }
    } catch (err) {
      if (err instanceof RedditRateLimitError) {
        setRedditRateLimited(err.endpoint);
      }
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [activeTab, settings, items, setItems, appendItems, setLoading, setError, setHasMore, setPage, updateItemSummary]);

  // Load feed when tab changes
  useEffect(() => {
    cancelAutoGenerate();
    reset();
    loadFeed(0);
  }, [activeTab, settings.hnFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadFeed(page + 1, true);
    }
  }, [loading, hasMore, page, loadFeed]);

  const handleRefresh = useCallback(async () => {
    cancelAutoGenerate();
    sessionCache.clear();
    reset();
    await loadFeed(0);
  }, [loadFeed, reset]);

  const emptyMessage = activeTab === 'substack' && settings.substacks.length === 0
    ? 'Add Substack publications in Settings to see content here.'
    : activeTab === 'twitter' && !settings.twitterApiKey
      ? 'Add your TwitterAPI.io key in Settings to see tweets.'
      : activeTab === 'twitter' && settings.twitterAccounts.length === 0
        ? 'Add X accounts to follow in Settings.'
        : activeTab === 'threads' && !settings.threadsToken
          ? 'Add your Meta access token in Settings to see Threads.'
          : activeTab === 'threads' && settings.threadsKeywords.length === 0
            ? 'Add keywords to search in Settings.'
            : null;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {/* Sub-filters for HN */}
      {activeTab === 'hn' && (
        <div className="flex gap-1 px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          {(['top', 'new', 'best'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => settings.setHnFilter(filter)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${
                settings.hnFilter === filter
                  ? 'bg-hn text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {emptyMessage && !loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        </div>
      )}

      <FeedList
        items={items}
        loading={loading}
        hasMore={hasMore}
        showBadges={activeTab === 'pulse'}
        onLoadMore={handleLoadMore}
      />
    </PullToRefresh>
  );
}
