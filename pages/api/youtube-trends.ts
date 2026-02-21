import type { NextApiRequest, NextApiResponse } from "next";
// Dynamically import YouTube helpers inside the handler to avoid static export resolution issues
import { expandKeywordsWithGemini } from "@/lib/geminiKeywordExpander";
import { extractPatternsWithGemini } from "@/lib/geminiPatterns";
import { prisma } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { profileId } = req.query;
    
    if (!profileId) {
      return res.status(400).json({ error: "Profile ID required" });
    }

    // Get user profile with keywords
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: profileId as string }
    });

    if (!userProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Parse niche keywords (normalize and dedupe)
    let userKeywords: string[] = [];
    try {
      const parsed = JSON.parse(userProfile.nicheKeywords);
      if (Array.isArray(parsed)) userKeywords = parsed.map(String);
      else if (typeof parsed === 'string') userKeywords = [parsed];
    } catch (e) {
      if (userProfile.nicheKeywords && typeof userProfile.nicheKeywords === 'string') {
        userKeywords = [userProfile.nicheKeywords];
      } else {
        userKeywords = [];
      }
    }
    userKeywords = userKeywords.map(k => k.trim()).filter(Boolean);
    userKeywords = Array.from(new Set(userKeywords));

    // Parse avoid keywords (normalize)
    let avoidKeywords: string[] = [];
    try {
      const parsedAvoid = JSON.parse(userProfile.avoidKeywords);
      if (Array.isArray(parsedAvoid)) avoidKeywords = parsedAvoid.map(String);
      else if (typeof parsedAvoid === 'string') avoidKeywords = [parsedAvoid];
    } catch (e) {
      avoidKeywords = [];
    }
    avoidKeywords = avoidKeywords.map(k => k.trim()).filter(Boolean);
    avoidKeywords = Array.from(new Set(avoidKeywords));

    if (userKeywords.length === 0) {
      return res.status(400).json({ 
        error: "No keywords found. Please update your profile." 
      });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({ error: "Missing YOUTUBE_API_KEY" });
    }

    // STEP 1: Use Gemini to expand keywords for better search
    let searchTerms: string[] = [];
    let expandedQuery: string | null = null;
    let usedGeminiForExpansion = false;
    try {
      const expanded = await expandKeywordsWithGemini(
        userProfile.primaryNiche,
        userKeywords,
        avoidKeywords
      );
      searchTerms = Array.isArray(expanded.searchTerms) ? expanded.searchTerms.map(String) : [];
      expandedQuery = typeof expanded.expandedQuery === 'string' ? expanded.expandedQuery : null;
      usedGeminiForExpansion = searchTerms.length > 0;
    } catch (err) {
      console.error('Keyword expansion failed, falling back to raw keywords:', String((err as any)?.message ?? err));
      searchTerms = [...userKeywords];
      expandedQuery = null;
      usedGeminiForExpansion = false;
    }

    // normalize/dedupe searchTerms
    searchTerms = searchTerms.map(s => s.trim()).filter(Boolean);
    searchTerms = Array.from(new Set(searchTerms)).slice(0, 40);

    console.log('🎯 Original keywords:', userKeywords);
    console.log('🚀 Expanded search terms:', searchTerms);

    // Get videos from last 30 days
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);

    // STEP 2: Search YouTube with expanded keywords (use search helper if available, otherwise fallback to trending filter)
    // Use dynamic import to avoid bundler static export checks
    const yt = await import('../../lib/youtube');
    const searchHelper = typeof yt.searchTrendingVideosByKeywords === 'function' ? yt.searchTrendingVideosByKeywords : null;
    const fetchTrending = typeof yt.fetchTrendingVideos === 'function' ? yt.fetchTrendingVideos : null;

    let searchResults: any[] = [];
    if (searchHelper) {
      searchResults = await searchHelper({
        apiKey: process.env.YOUTUBE_API_KEY,
        keywords: searchTerms,
        regionCode: userProfile.region || "US",
        maxResults: 50,
        publishedAfter: lastMonth.toISOString(),
      });
    } else if (fetchTrending) {
      // fallback: fetch mostPopular and filter by presence of any search term
      const trending = await fetchTrending({
        apiKey: process.env.YOUTUBE_API_KEY,
        regionCode: userProfile.region || "US",
        maxResults: 50,
      });
      const termsLower = searchTerms.map(s => s.toLowerCase()).filter(Boolean);
      searchResults = trending.filter(v => {
        const hay = [v.title, v.description, ...(v.tags || [])].join(' ').toLowerCase();
        return termsLower.some(t => hay.includes(t));
      });
    } else {
      throw new Error('No YouTube helper available');
    }

    // STEP 3: Score and rank videos - ensure all ScoredVideo fields are present
    const scoredVideos = searchResults
      .map(video => {
        const titleLower = String(video.title || '').toLowerCase();
        const descLower = String(video.description || '').toLowerCase();

        // compute matched terms and a simple weighted relevance
        let rawScore = 0;
        const matchedTerms: string[] = [];

        for (const kw of searchTerms) {
          const k = String(kw).toLowerCase();
          if (!k) continue;
          if (titleLower.includes(k)) {
            rawScore += 1.0; // title match
            matchedTerms.push(kw);
          } else if (descLower.includes(k)) {
            rawScore += 0.5; // description match
            matchedTerms.push(kw);
          }
        }

        // normalize rawScore by possible max (searchTerms.length)
        const maxPossible = Math.max(1, searchTerms.length);
        let relevanceNormalized = Math.min(1, rawScore / maxPossible);

        // engagement boost (views/likes/comments heuristic)
  const trendingScore = 0; // YouTubeTrendingVideo may not include a trendingScore field
        const engagementBoost = Math.min((Number(video.viewCount || 0) > 0 ? ((Number(video.likeCount || 0) + Number(video.commentCount || 0)) / Math.max(1, Number(video.viewCount || 1))) : 0) * 2.5, 0.25);

        let finalScore = (relevanceNormalized * 0.7) + Math.min(trendingScore / 10000, 0.3) + engagementBoost;
        finalScore = Math.max(0, Math.min(finalScore, 1));

        return {
          videoId: video.videoId,
          title: video.title,
          description: video.description,
          channelTitle: video.channelTitle,
          // channelId not always present on fetched objects; omit or set empty
          channelId: (video as any).channelId || '',
          publishedAt: video.publishedAt,
          thumbnails: video.thumbnails,
          tags: video.tags || [],
          categoryId: video.categoryId || '',
          viewCount: video.viewCount || 0,
          likeCount: video.likeCount || 0,
          commentCount: video.commentCount || 0,
          matchedTerms: Array.from(new Set(matchedTerms)),
          relevanceScore: finalScore,
          trendingScore: trendingScore,
        };
      })
      .filter(v => v.relevanceScore > 0.08)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 12);

    console.log(`📊 Found ${scoredVideos.length} relevant trending videos`);

    // STEP 4: Get Gemini insights on the top videos (best-effort)
    let patterns: any = { items: [] };
    let usedGemini = false;
    try {
      const gem = await extractPatternsWithGemini({
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        niche: userProfile.primaryNiche,
        videos: scoredVideos,
      });
      patterns = gem.patterns ?? gem;
      usedGemini = Boolean(gem.usedGemini || (patterns && (patterns.items || []).length > 0));
    } catch (err) {
      console.error('Pattern extraction failed, continuing without Gemini patterns:', String((err as any)?.message ?? err));
      patterns = { items: [] };
      usedGemini = false;
    }

    return res.status(200).json({
      niche: userProfile.primaryNiche,
      originalKeywords: userKeywords,
      expandedKeywords: searchTerms,
      region: userProfile.region || "US",
      videos: scoredVideos.map(v => ({
        videoId: v.videoId,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        title: v.title,
        channelTitle: v.channelTitle,
        publishedAt: v.publishedAt,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        commentCount: v.commentCount,
        matchedTerms: v.matchedTerms,
        relevanceScore: v.relevanceScore,
        thumbnails: v.thumbnails,
      })),
      patterns,
      meta: {
        usedGemini,
        expandedQuery,
        totalVideosFetched: searchResults.length,
      }
    });
  } catch (e: any) {
    console.error('YouTube trends error:', e);
    return res.status(500).json({
      error: "Failed to fetch personalized trends",
      message: String(e?.message ?? e),
    });
  }
}