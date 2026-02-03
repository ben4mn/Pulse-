import type { FeedItem } from '../providers/types';

export function mixFeeds(feeds: FeedItem[][]): FeedItem[] {
  const all = feeds.flat();

  // Deduplicate by URL if present
  const seen = new Set<string>();
  const unique = all.filter((item) => {
    if (item.url) {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
    }
    return true;
  });

  // Sort by composite score: recency + engagement + AI score
  const now = Date.now();
  unique.sort((a, b) => {
    const scoreA = computeRankScore(a, now);
    const scoreB = computeRankScore(b, now);
    return scoreB - scoreA;
  });

  return unique;
}

function computeRankScore(item: FeedItem, now: number): number {
  // Time decay: items lose 50% relevance per 6 hours
  const ageHours = (now - item.timestamp) / (1000 * 60 * 60);
  const timeScore = Math.pow(0.5, ageHours / 6);

  // Engagement score (normalized log scale)
  const engagement = Math.log10(1 + (item.score ?? 0)) / 5; // /5 to normalize ~100k scores to ~1

  // AI relevance score
  const ai = item.aiScore ?? 0.5;

  // Weighted combination
  return timeScore * 0.5 + engagement * 0.3 + ai * 0.2;
}
