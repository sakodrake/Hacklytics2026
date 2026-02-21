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
