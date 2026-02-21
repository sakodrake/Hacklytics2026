import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import {
  aggregateInsights,
  computeMatchScore,
  computeVelocityScore,
  computeReplicabilityScore,
  computeFinalScore,
  Insights
} from '@/lib/analytics';

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
        topHashtags: [],
        matchHistogram: Array(10).fill(0),
        engagementByTrend: [],
        leaderboard: [],
        hookPatterns: []
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
    
    // Compute final scores for each video
    const videosWithScores = snapshot.videos.map(video => {
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
        caption: video.caption,
        views: video.views,
        likes: video.likes,
        comments: video.comments,
        shares: video.shares,
        finalScore
      };
    });
    
    const insights = aggregateInsights(videosWithScores, snapshot.hashtags);
    
    return res.status(200).json({
      fetchedAt: snapshot.createdAt,
      ...insights
    });
  } catch (error) {
    console.error('Error in /api/insights:', error);
    return res.status(500).json({
      error: 'Failed to fetch insights',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
