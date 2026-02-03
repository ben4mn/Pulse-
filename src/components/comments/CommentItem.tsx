import { useState, useRef, useCallback } from 'react';
import type { Comment } from '../../providers/types';

const THREAD_COLORS = ['thread-0', 'thread-1', 'thread-2', 'thread-3', 'thread-4', 'thread-5'];

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function countChildren(comment: Comment): number {
  let count = 0;
  for (const child of comment.children) {
    count += 1 + countChildren(child);
  }
  return count;
}

interface Props {
  comment: Comment;
}

export function CommentItem({ comment }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const touchStartX = useRef(0);
  const swiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    swiping.current = false;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) setCollapsed(true);
      else setCollapsed(false);
    }
  }, []);

  const childCount = countChildren(comment);
  const colorClass = THREAD_COLORS[comment.depth % THREAD_COLORS.length];

  return (
    <div
      style={{ marginLeft: comment.depth * 12 }}
      className={`border-l-2 ${colorClass}`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 touch-target cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <span className="text-xs font-medium text-pulse">{comment.author}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(comment.timestamp)}</span>
        {comment.score !== undefined && comment.score > 1 && (
          <span className="text-xs text-slate-400">{comment.score}</span>
        )}
        {collapsed && childCount > 0 && (
          <span className="text-xs text-slate-400 ml-auto">[+{childCount}]</span>
        )}
      </div>

      {/* Body + Children */}
      <div className={collapsed ? 'comment-body-collapsed' : 'comment-body-expanded'}>
        <div
          className="px-3 pb-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed [&_a]:text-pulse [&_a]:underline [&_p]:mb-1.5 [&_pre]:bg-slate-100 dark:[&_pre]:bg-slate-800 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:text-xs [&_pre]:my-2 [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs"
          dangerouslySetInnerHTML={{ __html: comment.body }}
        />

        {comment.children.length > 0 && (
          <div className="mt-1">
            {comment.children.map((child) => (
              <CommentItem key={child.id} comment={child} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
