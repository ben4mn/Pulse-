import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './components/layout/NavBar';
import { SettingsModal } from './components/settings/SettingsModal';
import { useUIStore } from './store/uiStore';

function RedditRateLimitBanner() {
  const { redditRateLimited, redditRateLimitHits, dismissRedditRateLimit } = useUIStore();
  if (!redditRateLimited) return null;

  const last = redditRateLimitHits[redditRateLimitHits.length - 1];
  const total = redditRateLimitHits.length;
  const ago = last ? `${Math.round((Date.now() - last.timestamp) / 1000)}s ago` : '';

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white text-xs px-4 py-2 flex items-center justify-between safe-top">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-semibold shrink-0">Reddit 429</span>
        <span className="truncate">
          Rate limited — {total} hit{total > 1 ? 's' : ''} this session{ago ? ` (last: ${ago})` : ''}
        </span>
      </div>
      <button
        onClick={dismissRedditRateLimit}
        className="shrink-0 ml-2 px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
      >
        Dismiss
      </button>
    </div>
  );
}

export function App() {
  const darkMode = useUIStore((s) => s.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <RedditRateLimitBanner />
      <NavBar />
      <main>
        <Outlet />
      </main>
      <SettingsModal />
    </div>
  );
}
