import { useUIStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ApiKeyManager } from './ApiKeyManager';
import { SourcePicker } from './SourcePicker';

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen } = useUIStore();
  const settings = useSettingsStore();

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setSettingsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto safe-bottom">
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        <div className="p-4 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* AI section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">AI Features</h3>
            <ApiKeyManager
              label="OpenAI API Key"
              value={settings.openaiKey}
              onChange={settings.setOpenaiKey}
              placeholder="sk-..."
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">Auto-generate summaries</span>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.summariesEnabled}
                  onChange={(e) => settings.setSummariesEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-checked:bg-pulse rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
              </label>
            </div>
          </div>

          {/* HN section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hacker News</h3>
            <div className="flex gap-2">
              {(['top', 'new', 'best'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => settings.setHnFilter(filter)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
                    settings.hnFilter === filter
                      ? 'bg-pulse text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Reddit section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reddit</h3>
            <SourcePicker
              label="Subreddits"
              items={settings.subreddits}
              onAdd={settings.addSubreddit}
              onRemove={settings.removeSubreddit}
              placeholder="e.g. programming"
            />
          </div>

          {/* Substack section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Substack</h3>
            <SourcePicker
              label="Publications"
              items={settings.substacks}
              onAdd={settings.addSubstack}
              onRemove={settings.removeSubstack}
              placeholder="e.g. stratechery.com or slug"
            />
          </div>

          {/* Twitter section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">X / Twitter</h3>
            <ApiKeyManager
              label="TwitterAPI.io Key"
              value={settings.twitterApiKey}
              onChange={settings.setTwitterApiKey}
            />
            <SourcePicker
              label="Accounts to follow"
              items={settings.twitterAccounts}
              onAdd={settings.addTwitterAccount}
              onRemove={settings.removeTwitterAccount}
              placeholder="e.g. elonmusk"
            />
          </div>

          {/* Threads section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Threads</h3>
            <ApiKeyManager
              label="Meta Access Token"
              value={settings.threadsToken}
              onChange={settings.setThreadsToken}
            />
            <SourcePicker
              label="Keywords"
              items={settings.threadsKeywords}
              onAdd={settings.addThreadsKeyword}
              onRemove={settings.removeThreadsKeyword}
              placeholder="e.g. AI, startups"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
