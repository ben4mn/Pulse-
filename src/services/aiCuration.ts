import { localCache } from './cache';
import type { FeedItem } from '../providers/types';

const PROFILE_KEY = 'pulse_interest_profile';
const SCORE_TTL = 6 * 60 * 60 * 1000;

interface InterestProfile {
  keywords: Record<string, number>; // keyword → weight
  domains: Record<string, number>;
  platforms: Record<string, number>;
}

function getProfile(): InterestProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { keywords: {}, domains: {}, platforms: {} };
}

function saveProfile(profile: InterestProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function recordInteraction(item: FeedItem) {
  const profile = getProfile();

  // Boost platform
  profile.platforms[item.platform] = (profile.platforms[item.platform] ?? 0) + 1;

  // Extract keywords from title
  if (item.title) {
    const words = item.title.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    for (const word of words) {
      profile.keywords[word] = (profile.keywords[word] ?? 0) + 1;
    }
  }

  // Extract domain
  if (item.url) {
    try {
      const domain = new URL(item.url).hostname;
      profile.domains[domain] = (profile.domains[domain] ?? 0) + 1;
    } catch { /* ignore */ }
  }

  saveProfile(profile);
}

export async function scoreItems(
  items: FeedItem[],
  apiKey: string,
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  const profile = getProfile();

  // If no API key or empty profile, use local heuristic scoring
  if (!apiKey || Object.keys(profile.keywords).length < 5) {
    for (const item of items) {
      scores.set(item.id, heuristicScore(item, profile));
    }
    return scores;
  }

  // Batch score via OpenAI for items without cached scores
  const uncached: FeedItem[] = [];
  for (const item of items) {
    const cached = localCache.get<number>(`ai_score_${item.id}`, SCORE_TTL);
    if (cached !== null) {
      scores.set(item.id, cached);
    } else {
      uncached.push(item);
    }
  }

  if (uncached.length === 0) return scores;

  // Top interests for prompt
  const topKeywords = Object.entries(profile.keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([k]) => k);

  const itemDescriptions = uncached.slice(0, 20).map((item, i) =>
    `${i}: ${item.title ?? item.body?.slice(0, 100) ?? ''} [${item.platform}]`,
  ).join('\n');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Score each item 0-1 for relevance to a user interested in: ${topKeywords.join(', ')}. Return JSON: {"scores": [0.8, 0.3, ...]} matching input order.`,
          },
          { role: 'user', content: itemDescriptions },
        ],
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const aiScores: number[] = parsed.scores ?? [];
        for (let i = 0; i < Math.min(aiScores.length, uncached.length); i++) {
          const score = Math.max(0, Math.min(1, aiScores[i]));
          scores.set(uncached[i].id, score);
          localCache.set(`ai_score_${uncached[i].id}`, score);
        }
      }
    }
  } catch {
    // Fall back to heuristic
  }

  // Fill remaining with heuristic
  for (const item of uncached) {
    if (!scores.has(item.id)) {
      scores.set(item.id, heuristicScore(item, profile));
    }
  }

  return scores;
}

function heuristicScore(item: FeedItem, profile: InterestProfile): number {
  let score = 0.5;
  const totalInteractions = Object.values(profile.platforms).reduce((a, b) => a + b, 0) || 1;

  // Platform preference
  const platformWeight = (profile.platforms[item.platform] ?? 0) / totalInteractions;
  score += platformWeight * 0.2;

  // Keyword matching
  if (item.title) {
    const words = item.title.toLowerCase().split(/\W+/);
    const topKeywords = Object.entries(profile.keywords).sort((a, b) => b[1] - a[1]).slice(0, 50);
    const maxWeight = topKeywords[0]?.[1] ?? 1;
    for (const [keyword, weight] of topKeywords) {
      if (words.includes(keyword)) {
        score += (weight / maxWeight) * 0.05;
      }
    }
  }

  return Math.max(0, Math.min(1, score));
}
