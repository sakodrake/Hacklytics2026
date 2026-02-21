import type { NextApiRequest, NextApiResponse } from "next";
import { fetchTrendingVideos } from "@/lib/youtube";
import { scoreTrendingByNiche } from "@/lib/nicheScore";
import { extractPatternsWithGemini } from "@/lib/geminiPatterns";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
  const niche = String(req.query.niche ?? "").trim();
  const keywordsParam = String(req.query.keywords ?? "").trim();
  const keywords = keywordsParam ? keywordsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
    const region = String(req.query.region ?? process.env.YOUTUBE_REGION ?? "US").trim().toUpperCase();

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        error: "Missing YOUTUBE_API_KEY env var",
      });
    }

    // 1) Pull "mostPopular" trending videos for the region
    const trending = await fetchTrendingVideos({
      apiKey: process.env.YOUTUBE_API_KEY,
      regionCode: region,
      maxResults: 50,
    });

    // 2) Sort by niche relevance (simple matching + light engagement boost)
    // Use keywords array if provided, else fallback to niche string
    const scorerInput = keywords.length ? keywords : niche;
    const scored = scoreTrendingByNiche(trending, scorerInput);
    const top = scored
      .filter(v => (keywords.length ? v.relevanceScore > 0 : (niche ? v.relevanceScore > 0 : true)))
      .slice(0, 12);

    // 3) Gemini extracts patterns from the top matches
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY?.trim();
    const { patterns, usedGemini, rawText } = await extractPatternsWithGemini({
      geminiApiKey: process.env.GEMINI_API_KEY,
      niche: niche || "general",
      videos: top,
    });

    // 4) Return for the UI to render
    return res.status(200).json({
  niche: niche || "",
  keywords: keywords.slice(0, 10),
      region,
      source: "youtube_mostPopular",
      videos: top.map(v => ({
        videoId: v.videoId,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        title: v.title,
        channelTitle: v.channelTitle,
        publishedAt: v.publishedAt,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        commentCount: v.commentCount,
        tags: v.tags,
        matchedTerms: v.matchedTerms,
        relevanceScore: v.relevanceScore,
        thumbnails: v.thumbnails ?? null,
      })),
      patterns,
      meta: {
        usedGemini,
        geminiDebug: process.env.NODE_ENV === "development" ? (rawText ?? null) : null,
        totalTrendingFetched: trending.length,
      }
    });
  } catch (e: any) {
    return res.status(500).json({
      error: "youtube-trends failed",
      message: String(e?.message ?? e),
    });
  }
}
