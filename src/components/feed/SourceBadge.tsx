import type { Platform } from '../../providers/types';

const config: Record<Platform, { label: string; color: string; bg: string }> = {
  hn: { label: 'HN', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  reddit: { label: 'Reddit', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  substack: { label: 'Substack', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  twitter: { label: 'X', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  threads: { label: 'Threads', color: 'text-gray-800 dark:text-gray-200', bg: 'bg-gray-100 dark:bg-gray-800' },
};

export function SourceBadge({ platform }: { platform: Platform }) {
  const c = config[platform];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${c.color} ${c.bg}`}>
      {c.label}
    </span>
  );
}
