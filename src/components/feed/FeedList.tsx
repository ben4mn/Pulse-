import { useCallback, useEffect, useRef } from 'react';
import type { FeedItem } from '../../providers/types';
import { FeedItemCard } from './FeedItem';
import { FeedSkeleton } from './FeedSkeleton';

interface Props {
  items: FeedItem[];
  loading: boolean;
  hasMore: boolean;
  showBadges?: boolean;
  onLoadMore: () => void;
}

export function FeedList({ items, loading, hasMore, showBadges, onLoadMore }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleIntersection, { rootMargin: '400px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersection]);

  if (loading && items.length === 0) {
    return <FeedSkeleton />;
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((item) => (
        <FeedItemCard key={item.id} item={item} showBadge={showBadges} />
      ))}
      {loading && <FeedSkeleton count={3} />}
      {hasMore && <div ref={sentinelRef} className="h-px" />}
      {!hasMore && items.length > 0 && (
        <div className="text-center text-sm text-slate-400 py-8">
          No more items
        </div>
      )}
    </div>
  );
}
