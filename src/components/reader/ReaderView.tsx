import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { marked } from 'marked';
import { useFeedStore } from '../../store/feedStore';
import { extractArticle } from '../../services/articleExtractor';
import { ReaderHeader } from './ReaderHeader';

export function ReaderView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, currentItem, articleContent, articleLoading, setCurrentItem, setArticleContent, setArticleLoading } = useFeedStore();

  const itemId = id ? decodeURIComponent(id) : null;
  const item = currentItem ?? items.find((i) => i.id === itemId) ?? null;

  useEffect(() => {
    if (!item && itemId) {
      const found = items.find((i) => i.id === itemId);
      if (found) setCurrentItem(found);
    }
  }, [item, itemId, items, setCurrentItem]);

  useEffect(() => {
    if (!item?.url) return;
    setArticleLoading(true);
    setArticleContent(null);

    extractArticle(item.url, item.id)
      .then((article) => {
        setArticleContent(article.content);
      })
      .catch(() => setArticleContent(null))
      .finally(() => setArticleLoading(false));
  }, [item?.url, item?.id, setArticleContent, setArticleLoading]);

  if (!item) {
    return (
      <div className="p-4 text-center text-slate-400">
        <button onClick={() => navigate(-1)} className="text-pulse mb-4">&larr; Back</button>
        <p>Item not found</p>
      </div>
    );
  }

  const wordCount = articleContent?.split(/\s+/).length ?? 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 230));

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
          <div className="flex-1" />
          {item.commentCount !== undefined && item.commentCount > 0 && (
            <button
              onClick={() => navigate(`/comments/${encodeURIComponent(item.id)}`)}
              className="text-xs text-pulse font-medium"
            >
              {item.commentCount} comments
            </button>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
            >
              Original
            </a>
          )}
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto">
        <ReaderHeader item={item} readingTime={articleContent ? readingTime : undefined} />

        {articleLoading && (
          <div className="space-y-3 mt-4">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-4/6" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        )}

        {articleContent && (
          <div
            className="reader-text mt-4"
            dangerouslySetInnerHTML={{ __html: marked.parse(articleContent) as string }}
          />
        )}

        {!articleLoading && !articleContent && item.body && (
          <div
            className="reader-text mt-4"
            dangerouslySetInnerHTML={{ __html: item.body }}
          />
        )}

        {!articleLoading && !articleContent && !item.body && (
          <div className="text-center text-slate-400 mt-8">
            <p>Could not extract article content.</p>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-pulse mt-2 inline-block">
                Open original &rarr;
              </a>
            )}
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex gap-2 mt-8 pb-8">
          {item.commentCount !== undefined && item.commentCount > 0 && (
            <button
              onClick={() => navigate(`/comments/${encodeURIComponent(item.id)}`)}
              className="flex-1 py-2.5 px-4 bg-pulse text-white rounded-lg text-sm font-medium"
            >
              View {item.commentCount} Comments
            </button>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium text-center"
            >
              Open Original
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
