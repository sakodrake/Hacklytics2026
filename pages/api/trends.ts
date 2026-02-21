import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import {
  computeMatchScore,
  computeVelocityScore,
  computeReplicabilityScore,
  computeFinalScore,
  TrendScore
} from '@/lib/analytics';

interface TrendItem {
  id: string;
  url: string;
  caption: string | null;
  hashtags: string[];
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  scores: TrendScore;
  reasons: {
    matchReasons: string[];
    replicabilityReasons: string[];
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { profileId } = req.query;
    
    // Fetch latest snapshot
    const snapshot = await prisma.trendSnapshot.findFirst({
      where: profileId ? { userProfileId: profileId as string } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        videos: true,
        hashtags: true,
        userProfile: true
      }
    });
    
    if (!snapshot) {
      return res.status(200).json({
        fetchedAt: null,
        counts: { videoCount: 0, hashtagCount: 0 },
        trends: []
      });
    }
    
    const profile = snapshot.userProfile;
    let nicheKeywords: string[] = [];
    if (profile?.nicheKeywords) {
      try {
        nicheKeywords = JSON.parse(profile.nicheKeywords);
      } catch (e) {
        nicheKeywords = [];
      }
    }
    const noFace = profile?.noFace || false;
    const effortLevel = profile?.effortLevel || 'med';
    
    // Compute scores for each video
    const trends: TrendItem[] = snapshot.videos
      .map(video => {
        let hashtags: string[] = [];
        try {
          hashtags = JSON.parse(video.hashtags || '[]');
        } catch (e) {
          hashtags = [];
        }
        
        const matchScore = computeMatchScore(nicheKeywords, video.caption, hashtags);
        const velocityScore = computeVelocityScore(
          video.views,
          video.likes,
          video.comments,
          video.shares,
          snapshot.createdAt
        );
        const replicabilityScore = computeReplicabilityScore(
          { noFace, effortLevel },
          video.caption,
          hashtags
        );
        const finalScore = computeFinalScore(
          matchScore.score,
          velocityScore.score,
          replicabilityScore.score
        );
        
        return {
          id: video.id,
          url: video.url,
          caption: video.caption,
          hashtags: hashtags,
          views: video.views,
          likes: video.likes,
          comments: video.comments,
          shares: video.shares,
          scores: {
            match: matchScore.score,
            velocity: velocityScore.score,
            replicability: replicabilityScore.score,
            final: finalScore
          },
          reasons: {
            matchReasons: matchScore.reasons,
            replicabilityReasons: replicabilityScore.reasons
          }
        };
      })
      .sort((a, b) => b.scores.final - a.scores.final);
    
    return res.status(200).json({
      fetchedAt: snapshot.createdAt,
      counts: {
        videoCount: snapshot.videoCount,
        hashtagCount: snapshot.hashtagCount
      },
      trends
    });
  } catch (error) {
    console.error('Error in /api/trends:', error);
    return res.status(500).json({
      error: 'Failed to fetch trends',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
