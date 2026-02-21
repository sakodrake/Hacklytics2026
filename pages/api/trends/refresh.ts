import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { generateMockTrends, generateMockHashtags } from '@/lib/mockTrendData';

interface ApifyItem {
  url?: string;
  videoUrl?: string;
  shareUrl?: string;
  text?: string;
  caption?: string;
  desc?: string;
  hashtags?: string[];
  stats?: {
    playCount?: number;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
  };
  playCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  authorName?: string;
  authorId?: string;
  createdAt?: string;
  [key: string]: any;
}

interface ApifyResponse {
  data?: ApifyItem[];
  items?: ApifyItem[];
}

const APIFY_API_URL = 'https://api.apify.com/v2';
const VIDEO_ACTOR_ID = 'lexis-solutions/tiktok-trending-videos-scraper';
const HASHTAG_ACTOR_ID = 'lexis-solutions/tiktok-trending-hashtags-scraper';

function normalizeVideoUrl(item: ApifyItem): string {
  return item.url || item.videoUrl || item.shareUrl || '';
}

function normalizeCaption(item: ApifyItem): string | null {
  const caption = item.text || item.caption || item.desc || '';
  return caption || null;
}

function extractHashtags(item: ApifyItem): string[] {
  const hashtags = new Set<string>();
  
  // From caption
  const caption = normalizeCaption(item);
  if (caption) {
    const matches = caption.match(/#([A-Za-z0-9_]+)/g) || [];
    if (matches) {
    matches.forEach((h: string) => {
      hashtags.add(h.toLowerCase());
  });
}
  }
  
  // From item.hashtags
  if (item.hashtags && Array.isArray(item.hashtags)) {
    item.hashtags.forEach(h => {
      const tag = (h as string).toLowerCase();
      if (!tag.startsWith('#')) hashtags.add(`#${tag}`);
      else hashtags.add(tag);
    });
  }
  
  return Array.from(hashtags);
}

async function callApifyActor(actorId: string): Promise<ApifyItem[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error('APIFY_TOKEN not set');
  }
  
  const url = `${APIFY_API_URL}/acts/${actorId}/run-sync-get-dataset-items?token=${token}&format=json&clean=true`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region: 'US' }) // minimal input
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Apify error (${actorId}):`, error);
      throw new Error(`Apify API error: ${response.status}`);
    }
    
    const data: ApifyResponse | ApifyItem[] = await response.json();
    return Array.isArray(data) ? data : (data.data || data.items || []);
  } catch (error) {
    console.error(`Failed to call Apify actor ${actorId}:`, error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { profileId, region } = req.body;
    let videoItems: any[] = [];
    let hashtagItems: any[] = [];
    let source = 'mock';

    // Check if APIFY_TOKEN is set
    if (process.env.APIFY_TOKEN) {
      try {
        // Try to fetch from Apify
        console.log('Fetching from Apify...');
        [videoItems, hashtagItems] = await Promise.all([
          callApifyActor(VIDEO_ACTOR_ID),
          callApifyActor(HASHTAG_ACTOR_ID)
        ]);
        source = 'apify';
        console.log(`Fetched ${videoItems.length} videos and ${hashtagItems.length} hashtags from Apify`);
      } catch (error) {
        console.error('Apify fetch failed, falling back to mock data:', error);
        videoItems = generateMockTrends(20);
        hashtagItems = generateMockHashtags(20);
        source = 'mock-fallback';
      }
    } else {
      // No token, use mock data
      console.log('No APIFY_TOKEN set, using mock data');
      videoItems = generateMockTrends(20);
      hashtagItems = generateMockHashtags(20);
      source = 'mock';
    }
    
    // Create snapshot
    const snapshot = await prisma.trendSnapshot.create({
      data: {
        source,
        videoCount: videoItems.length,
        hashtagCount: hashtagItems.length,
        userProfileId: profileId || null,
        createdAt: new Date()
      }
    });
    
    // Store videos
    if (videoItems.length > 0) {
      const videoData = videoItems.map((item: any) => {
        let hashtags: string[] = [];
        if (Array.isArray(item.hashtags)) {
          hashtags = item.hashtags;
        } else if (item.caption) {
          hashtags = extractHashtags(item as ApifyItem);
        }
        
        return {
          snapshotId: snapshot.id,
          url: item.url || normalizeVideoUrl(item as ApifyItem),
          caption: item.caption || normalizeCaption(item as ApifyItem),
          hashtags: JSON.stringify(hashtags),
          authorName: item.authorName || null,
          authorId: item.authorId || null,
          views: item.views || item.stats?.playCount || item.playCount || null,
          likes: item.likes || item.stats?.likeCount || item.likeCount || null,
          comments: item.comments || item.stats?.commentCount || item.commentCount || null,
          shares: item.shares || item.stats?.shareCount || item.shareCount || null,
          createdAtSource: item.createdAtSource ? new Date(item.createdAtSource) : (item.createdAt ? new Date(item.createdAt) : null),
          rawJson: JSON.stringify(item.rawJson || item)
        };
      });
      
      await prisma.trendVideo.createMany({
        data: videoData
      });
    }
    
    // Store hashtags
    if (hashtagItems.length > 0) {
      const hashtagData = hashtagItems.map((item: any, idx: number) => ({
        snapshotId: snapshot.id,
        hashtag: item.hashtag || item.text || `hashtag_${idx}`,
        rank: item.rank || idx + 1,
        views: item.views || item.playCount || null,
        rawJson: JSON.stringify(item.rawJson || item)
      }));
      
      await prisma.trendHashtag.createMany({
        data: hashtagData
      });
    }
    
    return res.status(200).json({
      snapshotId: snapshot.id,
      fetchedAt: snapshot.createdAt,
      videoCount: snapshot.videoCount,
      hashtagCount: snapshot.hashtagCount,
      source,
      demo: source === 'mock' || source === 'mock-fallback'
    });
  } catch (error) {
    console.error('Error in /api/trends/refresh:', error);
    return res.status(500).json({
      error: 'Failed to refresh trends',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
