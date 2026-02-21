// lib/youtube.ts
// Minimal YouTube Data API v3 helper focused on "mostPopular" trending.
// Docs: https://developers.google.com/youtube/v3/docs/videos/list

export type YouTubeTrendingVideo = {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  tags: string[];
  categoryId?: string;
  thumbnails?: Record<string, { url: string; width?: number; height?: number }>;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

type YouTubeApiVideoItem = any;

function num(n: any): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

export async function fetchTrendingVideos(params: {
  apiKey: string;
  regionCode: string;
  maxResults?: number; // <= 50
}): Promise<YouTubeTrendingVideo[]> {
  const { apiKey, regionCode } = params;
  const maxResults = Math.min(Math.max(params.maxResults ?? 25, 1), 50);

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("chart", "mostPopular");
  url.searchParams.set("regionCode", regionCode);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`YouTube videos.list failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const items: YouTubeApiVideoItem[] = Array.isArray(data?.items) ? data.items : [];

  return items.map((it) => {
    const sn = it?.snippet ?? {};
    const st = it?.statistics ?? {};
    return {
      videoId: String(it?.id ?? ""),
      title: String(sn?.title ?? ""),
      description: String(sn?.description ?? ""),
      channelTitle: String(sn?.channelTitle ?? ""),
      publishedAt: String(sn?.publishedAt ?? ""),
      tags: Array.isArray(sn?.tags) ? sn.tags.map(String) : [],
      categoryId: sn?.categoryId ? String(sn.categoryId) : undefined,
      thumbnails: sn?.thumbnails ?? undefined,
      viewCount: num(st?.viewCount),
      likeCount: num(st?.likeCount),
      commentCount: num(st?.commentCount),
    };
  }).filter(v => v.videoId);
}

// ADD THIS NEW FUNCTION for searching videos by keywords
export async function searchTrendingVideosByKeywords(params: {
  apiKey: string;
  keywords: string[];
  regionCode: string;
  maxResults?: number;
  publishedAfter?: string;
}): Promise<YouTubeTrendingVideo[]> {
  const { apiKey, keywords, regionCode } = params;
  const maxResults = Math.min(Math.max(params.maxResults ?? 25, 1), 50);
  
  // Create search query from keywords
  const searchQuery = keywords.join(' OR ');

  // First, search for videos
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("q", searchQuery);
  searchUrl.searchParams.set("regionCode", regionCode);
  searchUrl.searchParams.set("maxResults", String(maxResults));
  searchUrl.searchParams.set("order", "relevance");
  searchUrl.searchParams.set("key", apiKey);
  
  if (params.publishedAfter) {
    searchUrl.searchParams.set("publishedAfter", params.publishedAfter);
  }

  console.log('🔍 Searching YouTube for:', searchQuery);

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) {
    const text = await searchRes.text().catch(() => "");
    throw new Error(`YouTube search failed (${searchRes.status}): ${text}`);
  }

  const searchData = await searchRes.json();
  const searchItems: any[] = Array.isArray(searchData?.items) ? searchData.items : [];
  
  if (searchItems.length === 0) {
    return [];
  }

  // Get video IDs from search results
  const videoIds = searchItems
    .map(item => item.id?.videoId)
    .filter(Boolean)
    .join(',');

  // Fetch detailed statistics for these videos
  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("part", "snippet,statistics");
  statsUrl.searchParams.set("id", videoIds);
  statsUrl.searchParams.set("key", apiKey);

  const statsRes = await fetch(statsUrl.toString());
  if (!statsRes.ok) {
    const text = await statsRes.text().catch(() => "");
    throw new Error(`YouTube video stats failed (${statsRes.status}): ${text}`);
  }

  const statsData = await statsRes.json();
  const items: YouTubeApiVideoItem[] = Array.isArray(statsData?.items) ? statsData.items : [];

  // Calculate trending score based on views per day
  const now = new Date().getTime();

  return items.map((it) => {
    const sn = it?.snippet ?? {};
    const st = it?.statistics ?? {};
    const publishedAt = new Date(sn?.publishedAt ?? "").getTime();
    const daysOld = (now - publishedAt) / (1000 * 60 * 60 * 24);
    const viewCount = num(st?.viewCount);
    
    // Calculate trending score: views per day
    const viewsPerDay = viewCount / Math.max(daysOld, 1);
    
    return {
      videoId: String(it?.id ?? ""),
      title: String(sn?.title ?? ""),
      description: String(sn?.description ?? ""),
      channelTitle: String(sn?.channelTitle ?? ""),
      publishedAt: String(sn?.publishedAt ?? ""),
      tags: Array.isArray(sn?.tags) ? sn.tags.map(String) : [],
      categoryId: sn?.categoryId ? String(sn.categoryId) : undefined,
      thumbnails: sn?.thumbnails ?? undefined,
      viewCount: viewCount,
      likeCount: num(st?.likeCount),
      commentCount: num(st?.commentCount),
      trendingScore: viewsPerDay, // Add this field
    };
  }).filter(v => v.videoId);
}