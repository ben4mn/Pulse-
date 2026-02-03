export function FeedSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-px">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-4">
          <div className="skeleton h-4 w-3/4 mb-2" />
          <div className="skeleton h-3 w-1/2 mb-2" />
          <div className="flex gap-2">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
