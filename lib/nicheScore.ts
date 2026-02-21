// lib/nicheScore.ts
// Lightweight niche relevance scoring (intentionally not "too specific").

import type { YouTubeTrendingVideo } from "./youtube";

export type ScoredVideo = YouTubeTrendingVideo & {
  matchedTerms: string[];
  relevanceScore: number; // 0..1
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

// very small stopword list (keep hackathon-simple)
const STOP = new Set(["the","a","an","and","or","to","of","in","on","for","with","is","are","this","that","you","your"]);

export function scoreTrendingByNiche(videos: YouTubeTrendingVideo[], nicheOrKeywords: string | string[]): ScoredVideo[] {
  // Accept either a plain niche string or an array of keyword strings
  const rawTerms = Array.isArray(nicheOrKeywords)
    ? nicheOrKeywords.join(' ')
    : String(nicheOrKeywords || '');

  const nicheTerms = unique(tokenize(rawTerms).filter(t => !STOP.has(t)));
  if (nicheTerms.length === 0) {
    // if niche is empty/stopwords, return with neutral scores
    return videos.map(v => ({ ...v, matchedTerms: [], relevanceScore: 0.0 }));
  }

  return videos.map((v) => {
    const hay = [
      v.title,
      v.description,
      ...(v.tags ?? []),
      v.channelTitle
    ].join(" ").toLowerCase();

  // exact substring matches against combined fields
  const matched = nicheTerms.filter(t => hay.includes(t));

    // relevance: primarily lexical match coverage, lightly boosted by engagement
    const coverage = matched.length / nicheTerms.length; // 0..1
    const engagement = v.viewCount > 0 ? ((v.likeCount + v.commentCount) / v.viewCount) : 0; // ~0..0.2 typical
    const engagementBoost = Math.max(0, Math.min(engagement * 2.5, 0.25)); // cap boost at +0.25

    const relevanceScore = Math.max(0, Math.min(coverage + engagementBoost, 1));

    return {
      ...v,
      matchedTerms: matched,
      relevanceScore,
    };
  })
  .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
