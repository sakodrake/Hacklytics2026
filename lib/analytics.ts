// Basic English stopwords
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'will', 'with'
]);

export interface ScoreResult {
  score: number;
  reasons: string[];
}

export interface ReplicabilityResult extends ScoreResult {
  label: 'Easy' | 'Medium' | 'Hard';
}

export interface TrendScore {
  match: number;
  velocity: number;
  replicability: number;
  final: number;
}

export interface Insights {
  counts: { videoCount: number; hashtagCount: number };
  topHashtags: { name: string; count: number }[];
  matchHistogram: number[];
  engagementByTrend: { id: string; views: number; engagementRate: number; finalScore: number }[];
  leaderboard: { id: string; caption: string | null; finalScore: number }[];
  hookPatterns: { pattern: string; count: number }[];
}

/**
 * Tokenize text: lowercase, remove punctuation, split, remove stopwords, dedupe
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s#]/g, '')
    .split(/\s+/)
    .filter(t => t && !STOPWORDS.has(t));
  return [...new Set(tokens)];
}

/**
 * Extract hashtags from text using regex
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#([A-Za-z0-9_]+)/g) || [];
  return matches.map(h => h.toLowerCase());
}

/**
 * Compute match score: how well a trend aligns with user's niche keywords
 */
export function computeMatchScore(nicheKeywords: string[], caption: string | null, hashtags: string[]): ScoreResult {
  const tokens = new Set([
    ...tokenize(caption || ''),
    ...hashtags.map(h => h.replace('#', '').toLowerCase())
  ]);
  
  const overlap = nicheKeywords.filter(kw => tokens.has(kw.toLowerCase())).slice(0, 5);
  const totalKeywords = Math.max(8, Math.ceil(nicheKeywords.length * 0.2));
  const score = Math.min(100, Math.round((overlap.length / totalKeywords) * 100));
  
  return {
    score,
    reasons: overlap
  };
}

/**
 * Compute velocity score: engagement momentum
 */
export function computeVelocityScore(
  views: number | null,
  likes: number | null,
  comments: number | null,
  shares: number | null,
  fetchedAt: Date
): ScoreResult {
  const v = Math.max(views || 1, 1);
  const l = likes || 0;
  const c = comments || 0;
  const s = shares || 0;
  const eng = (l + c + s) / v;
  const recencyBoost = 1.0; // could decay over time if multiple snapshots
  
  const raw = Math.log10(v + 1) * (0.5 + 50 * eng) * recencyBoost;
  const score = Math.max(0, Math.min(100, Math.round(raw * 12)));
  
  return {
    score,
    reasons: [`${v.toLocaleString()} views`, `${(eng * 100).toFixed(1)}% engagement rate`]
  };
}

/**
 * Compute replicability score: how easy it is for user to replicate
 */
export function computeReplicabilityScore(
  { noFace, effortLevel }: { noFace: boolean; effortLevel: string },
  caption: string | null,
  hashtags: string[]
): ReplicabilityResult {
  let score = 70;
  const reasons: string[] = [];
  
  const text = `${caption || ''} ${hashtags.join(' ')}`.toLowerCase();
  
  // Effort level
  if (effortLevel === 'low') {
    score += 10;
    reasons.push('Low effort preference');
  } else if (effortLevel === 'high') {
    score -= 10;
    reasons.push('High effort accepted');
  }
  
  // No-face restrictions
  if (noFace && /storytime|get ready|day in the life/i.test(text)) {
    score -= 20;
    reasons.push('Conflicts with no-face preference');
  }
  
  // Difficulty patterns
  if (/capcut|transition|template/i.test(text)) {
    score -= 15;
    reasons.push('Requires advanced editing');
  }
  
  if (/screen record|tutorial|coding|vs code/i.test(text)) {
    score += 10;
    reasons.push('Tutorial-based (replicable)');
  }
  
  score = Math.max(0, Math.min(100, score));
  const label = score >= 70 ? 'Easy' : score >= 40 ? 'Medium' : 'Hard';
  
  return {
    score,
    reasons: reasons.length > 0 ? reasons : ['Medium difficulty'],
    label
  };
}

/**
 * Compute final score from component scores
 */
export function computeFinalScore(match: number, velocity: number, replicability: number): number {
  return Math.round(0.45 * match + 0.35 * velocity + 0.2 * replicability);
}

/**
 * Aggregate insights from video array
 */
export function aggregateInsights(
  videos: Array<{
    id: string;
    caption: string | null;
    views: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    finalScore?: number;
  }>,
  hashtags: Array<{ hashtag: string; views?: number | null }>
): Partial<Insights> {
  // Top hashtags
  const hashtagMap = new Map<string, number>();
  hashtags.forEach(h => {
    const tag = h.hashtag.replace('#', '').toLowerCase();
    hashtagMap.set(tag, (hashtagMap.get(tag) || 0) + (h.views || 1));
  });
  
  const topHashtags = Array.from(hashtagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
  
  // Match histogram (convert finalScores to match scores, approximate)
  const matchHistogram = Array(10).fill(0);
  if (videos.length > 0) {
    videos.forEach(v => {
      if (v.finalScore !== undefined) {
        const bucketIdx = Math.min(9, Math.floor(v.finalScore / 10));
        matchHistogram[bucketIdx]++;
      }
    });
  }
  
  // Engagement by trend
  const engagementByTrend = videos
    .map(v => ({
      id: v.id,
      views: v.views || 0,
      engagementRate: v.views ? ((v.likes || 0) + (v.comments || 0) + (v.shares || 0)) / v.views : 0,
      finalScore: v.finalScore || 0
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 20);
  
  // Leaderboard
  const leaderboard = videos
    .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
    .slice(0, 10)
    .map(v => ({
      id: v.id,
      caption: v.caption?.substring(0, 100) || 'No caption',
      finalScore: v.finalScore || 0
    }));
  
  // Hook patterns (for tech niche)
  const hookPatterns: { pattern: string; count: number }[] = [];
  const patterns = ['POV', '3 things', 'Stop', 'How to', 'Never knew', 'This is how', 'Wait for it'];
  patterns.forEach(pattern => {
    const count = videos.filter(v => v.caption?.toLowerCase().includes(pattern.toLowerCase())).length;
    if (count > 0) {
      hookPatterns.push({ pattern, count });
    }
  });
  
  return {
    counts: {
      videoCount: videos.length,
      hashtagCount: hashtags.length
    },
    topHashtags,
    matchHistogram,
    engagementByTrend,
    leaderboard,
    hookPatterns: hookPatterns.sort((a, b) => b.count - a.count)
  };
}
