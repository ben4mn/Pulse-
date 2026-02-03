import { useNavigate } from 'react-router-dom';
import type { FeedItem as FeedItemType } from '../../providers/types';
import { SourceBadge } from './SourceBadge';
import { recordInteraction } from '../../services/aiCuration';

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

interface Props {
  item: FeedItemType;
  showBadge?: boolean;
}

export function FeedItemCard({ item, showBadge }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    recordInteraction(item);
    if (item.url) {
      navigate(`/read/${encodeURIComponent(item.id)}`);
    } else if (item.commentCount) {
      navigate(`/comments/${encodeURIComponent(item.id)}`);
    }
  };

  const handleCommentsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    recordInteraction(item);
    navigate(`/comments/${encodeURIComponent(item.id)}`);
  };

  return (
    <article
      className="bg-white dark:bg-slate-900 p-4 touch-target cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {item.thumbnail && (
          <img
            src={item.thumbnail}
            alt=""
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0">
          {item.title && (
            <h3 className="text-[15px] font-medium leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
              {item.title}
            </h3>
          )}
          {!item.title && item.body && (
            <p className="text-[15px] leading-snug text-slate-900 dark:text-slate-100 line-clamp-3">
              {item.body}
            </p>
          )}

          {item.url && (
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
              {extractDomain(item.url)}
            </span>
          )}

          {item.summary && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-2 fade-in">
              {item.summary}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {showBadge && <SourceBadge platform={item.platform} />}
            {item.score !== undefined && (
              <span>{item.score} pts</span>
            )}
            <span>{item.author}</span>
            <span>{timeAgo(item.timestamp)}</span>
            {item.subreddit && (
              <span className="text-blue-500">r/{item.subreddit}</span>
            )}
            {item.publication && (
              <span className="text-orange-500">{item.publication}</span>
            )}
            {item.commentCount !== undefined && item.commentCount > 0 && (
              <button
                onClick={handleCommentsClick}
                className="ml-auto text-pulse hover:text-pulse-dark font-medium"
              >
                {item.commentCount} {item.commentCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
