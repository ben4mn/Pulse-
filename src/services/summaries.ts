import { localCache } from './cache';
import { extractPlainText } from './articleExtractor';

const SUMMARY_TTL = 24 * 60 * 60 * 1000;

interface SummaryResult {
  short: string;
  long: string;
}

let autoGenController: AbortController | null = null;

export function cancelAutoGenerate() {
  autoGenController?.abort();
  autoGenController = null;
}

export async function getSummary(
  itemId: string,
  title: string,
  url: string | undefined,
  apiKey: string,
): Promise<SummaryResult | null> {
  const cacheKey = `summary_${itemId}`;
  const cached = localCache.get<SummaryResult>(cacheKey, SUMMARY_TTL);
  if (cached) return cached;

  if (!apiKey || !url) return null;

  // Get article text
  let text = await extractPlainText(url);
  if (text.length < 200) return null;
  text = text.slice(0, 4000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Summarize the following article. Return JSON with two fields: "short" (1-2 sentences, max 50 words) and "long" (2-3 sentences, max 100 words). Be concise and informative.',
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nContent:\n${text}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    const result: SummaryResult = JSON.parse(content);
    localCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

export async function autoGenerateSummaries(
  items: Array<{ id: string; title?: string; url?: string }>,
  apiKey: string,
  onSummary: (id: string, summary: string) => void,
) {
  cancelAutoGenerate();
  autoGenController = new AbortController();

  for (const item of items) {
    if (autoGenController.signal.aborted) break;
    if (!item.title || !item.url) continue;

    const cacheKey = `summary_${item.id}`;
    const cached = localCache.get<SummaryResult>(cacheKey, SUMMARY_TTL);
    if (cached) {
      onSummary(item.id, cached.short);
      continue;
    }

    try {
      const result = await getSummary(item.id, item.title, item.url, apiKey);
      if (result && !autoGenController.signal.aborted) {
        onSummary(item.id, result.short);
      }
    } catch {
      // Skip on error, continue with next
    }
  }
}
