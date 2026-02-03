import type { FeedItem } from '../../providers/types';
import { SourceBadge } from '../feed/SourceBadge';

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

interface Props {
  item: FeedItem;
  readingTime?: number;
}

export function ReaderHeader({ item, readingTime }: Props) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold leading-tight text-slate-900 dark:text-slate-100 mb-2">
        {item.title ?? item.body?.slice(0, 100)}
      </h1>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <SourceBadge platform={item.platform} />
        {item.url && <span>{extractDomain(item.url)}</span>}
        <span>{item.author}</span>
        <span>{timeAgo(item.timestamp)}</span>
        {item.score !== undefined && <span>{item.score} pts</span>}
        {readingTime && <span>{readingTime} min read</span>}
      </div>
    </div>
  );
}
