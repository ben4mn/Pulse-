import { sessionCache } from './cache';
import type { Article } from '../providers/types';

const ARTICLE_TTL = 30 * 60 * 1000;

export async function extractArticle(url: string, itemId: string): Promise<Article> {
  const cacheKey = `article_${itemId}`;
  const cached = sessionCache.get<Article>(cacheKey, ARTICLE_TTL);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/markdown' },
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Jina error: ${res.status}`);
    let content = await res.text();

    // Strip Jina preamble (Title: ..., URL Source: ..., Markdown Content:)
    const contentMarker = 'Markdown Content:\n';
    const idx = content.indexOf(contentMarker);
    if (idx !== -1) {
      content = content.slice(idx + contentMarker.length);
    }

    const title = extractTitle(content) || url;
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 230));

    const article: Article = { title, content, url, wordCount, readingTime };
    sessionCache.set(cacheKey, article);
    return article;
  } finally {
    clearTimeout(timeout);
  }
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)/m);
  return match?.[1]?.trim() ?? '';
}

export async function extractPlainText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}
