// lib/geminiPatterns.ts
// Gemini pattern extraction: given a niche + a list of top videos, return structured patterns.

import type { ScoredVideo } from "./nicheScore";

type Patterns = {
  hooks: string[];
  formats: string[];
  editing: string[];
  titles: string[];
  thumbnails: string[];
  templateIdeas: string[];
  doNext: string[];
};

const DEFAULT_PATTERNS: Patterns = {
  hooks: [],
  formats: [],
  editing: [],
  titles: [],
  thumbnails: [],
  templateIdeas: [],
  doNext: [],
};

// Uses the Google Generative AI JS SDK already in package.json.
// Docs: https://ai.google.dev/api (generateContent).
export async function extractPatternsWithGemini(params: {
  geminiApiKey?: string;
  niche: string;
  videos: ScoredVideo[];
}): Promise<{ patterns: Patterns; rawText?: string; usedGemini: boolean }> {
  const { geminiApiKey, niche, videos } = params;
  if (!geminiApiKey) return { patterns: DEFAULT_PATTERNS, usedGemini: false };
  if (!videos?.length) return { patterns: DEFAULT_PATTERNS, usedGemini: false };

  // Lazy import so local dev doesn't crash if env missing.
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Keep prompt short + structured for hackathon reliability.
  const compact = videos.slice(0, 10).map(v => ({
    title: v.title,
    channel: v.channelTitle,
    publishedAt: v.publishedAt,
    viewCount: v.viewCount,
    likeCount: v.likeCount,
    commentCount: v.commentCount,
    tags: (v.tags ?? []).slice(0, 12),
    url: `https://www.youtube.com/watch?v=${v.videoId}`
  }));

  const prompt = [
    `You are a creator growth analyst.`,
    `Niche: "${niche}".`,
    ``,
    `Given these currently trending YouTube videos (JSON below), extract repeatable patterns and output STRICT JSON with this schema:`,
    `{`,
    `  "hooks": string[],`,
    `  "formats": string[],`,
    `  "editing": string[],`,
    `  "titles": string[],`,
    `  "thumbnails": string[],`,
    `  "templateIdeas": string[],`,
    `  "doNext": string[]`,
    `}`,
    ``,
    `Rules:`,
    `- No markdown, no extra keys, JSON only.`,
    `- "templateIdeas" should be actionable templates a creator can copy.`,
    `- Keep each string short (<= 120 chars).`,
    ``,
    `VIDEOS_JSON: ${JSON.stringify(compact)}`
  ].join("\n");

  try {
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? "";

    // Attempt strict JSON parse. If it fails, fall back gracefully.
    const parsed = safeJsonParse(text);
    if (parsed && typeof parsed === "object") {
      const patterns: Patterns = {
        hooks: arr(parsed.hooks),
        formats: arr(parsed.formats),
        editing: arr(parsed.editing),
        titles: arr(parsed.titles),
        thumbnails: arr(parsed.thumbnails),
        templateIdeas: arr(parsed.templateIdeas),
        doNext: arr(parsed.doNext),
      };
      return { patterns, rawText: text, usedGemini: true };
    }

    return { patterns: DEFAULT_PATTERNS, rawText: text, usedGemini: true };
  } catch (e: any) {
    return { patterns: DEFAULT_PATTERNS, rawText: String(e?.message ?? e), usedGemini: false };
  }
}

function arr(x: any): string[] {
  return Array.isArray(x) ? x.map(String).filter(Boolean) : [];
}

function safeJsonParse(text: string): any | null {
  // Best effort: find the first { ... } block.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}
