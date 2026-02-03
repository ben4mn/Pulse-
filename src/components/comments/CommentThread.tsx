import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFeedStore } from '../../store/feedStore';
import { useUIStore } from '../../store/uiStore';
import { SourceBadge } from '../feed/SourceBadge';
import { CommentItem } from './CommentItem';
import { hnProvider } from '../../providers/hn';
import { redditProvider, RedditRateLimitError } from '../../providers/reddit';

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

export function CommentThread() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, currentItem, comments, commentsLoading, setCurrentItem, setComments, setCommentsLoading } = useFeedStore();
  const { setRedditRateLimited } = useUIStore();

  const itemId = id ? decodeURIComponent(id) : null;
  const item = currentItem ?? items.find((i) => i.id === itemId) ?? null;

  useEffect(() => {
    if (!item && itemId) {
      const found = items.find((i) => i.id === itemId);
      if (found) setCurrentItem(found);
    }
  }, [item, itemId, items, setCurrentItem]);

  useEffect(() => {
    if (!item) return;
    setCommentsLoading(true);
    setComments([]);

    const provider = item.platform === 'reddit' ? redditProvider : hnProvider;
    if (!provider.fetchComments) {
      setCommentsLoading(false);
      return;
    }

    provider.fetchComments(item.id)
      .then(setComments)
      .catch((err) => {
        if (err instanceof RedditRateLimitError) setRedditRateLimited(err.endpoint);
        setComments([]);
      })
      .finally(() => setCommentsLoading(false));
  }, [item, setComments, setCommentsLoading, setRedditRateLimited]);

  if (!item) {
    return (
      <div className="p-4 text-center text-slate-400">
        <button onClick={() => navigate(-1)} className="text-pulse mb-4">&larr; Back</button>
        <p>Item not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 safe-top">
        <div className="flex items-center gap-3 px-4 h-12">
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center text-pulse text-sm font-medium"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Story header */}
      <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-1.5">
          {item.title ?? item.body?.slice(0, 100)}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <SourceBadge platform={item.platform} />
          <span>{item.author}</span>
          <span>{timeAgo(item.timestamp)}</span>
          {item.score !== undefined && <span>{item.score} pts</span>}
          {item.commentCount !== undefined && <span>{item.commentCount} comments</span>}
        </div>

        <div className="flex gap-2 mt-3">
          {item.url && (
            <button
              onClick={() => navigate(`/read/${encodeURIComponent(item.id)}`)}
              className="px-3 py-1.5 bg-pulse text-white rounded-md text-xs font-medium"
            >
              Read Article
            </button>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs font-medium"
            >
              Open Original
            </a>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="py-2">
        {commentsLoading && (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-3 w-32" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!commentsLoading && comments.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-8">No comments</div>
        )}

        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
