import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET request - fetch profile
  if (req.method === 'GET') {
    try {
      const { profileId } = req.query;
      
      if (!profileId) {
        return res.status(400).json({ error: 'Profile ID required' });
      }

      const profile = await prisma.userProfile.findUnique({
        where: { id: profileId as string }
      });

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Parse nicheKeywords
      let nicheKeywords: string[] = [];
      try {
        nicheKeywords = JSON.parse(profile.nicheKeywords);
      } catch (e) {
        nicheKeywords = profile.nicheKeywords ? [profile.nicheKeywords] : [];
      }

      // Parse avoidKeywords
      let avoidKeywords: string[] = [];
      try {
        avoidKeywords = JSON.parse(profile.avoidKeywords);
      } catch (e) {
        avoidKeywords = profile.avoidKeywords ? [profile.avoidKeywords] : [];
      }

      return res.status(200).json({
        ...profile,
        nicheKeywords,
        avoidKeywords
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  // Handle POST request - create profile
  if (req.method === 'POST') {
    try {
      const { 
        primaryNiche, 
        nicheKeywords, 
        avoidKeywords = [], // Add this
        noFace, 
        effortLevel, 
        region,
        videoLength = 30, // Add default
        preferencesJson = '{}' // Add this
      } = req.body;
      
      // Ensure nicheKeywords is stored as JSON string
      const keywordsArray = Array.isArray(nicheKeywords) 
        ? nicheKeywords 
        : (nicheKeywords ? nicheKeywords.split(',').map((k: string) => k.trim()) : []);
      
      // Ensure avoidKeywords is stored as JSON string
      const avoidArray = Array.isArray(avoidKeywords) 
        ? avoidKeywords 
        : (avoidKeywords ? avoidKeywords.split(',').map((k: string) => k.trim()) : []);

      const profile = await prisma.userProfile.create({
        data: {
          primaryNiche: primaryNiche || 'general',
          nicheKeywords: JSON.stringify(keywordsArray),
          avoidKeywords: JSON.stringify(avoidArray), // Add this required field
          noFace: noFace || false,
          effortLevel: effortLevel || 'med',
          region: region || 'US',
          videoLength: videoLength || 30,
          preferencesJson: preferencesJson
        }
      });

      return res.status(200).json(profile);
    } catch (error) {
      console.error('Error creating profile:', error);
      return res.status(500).json({ error: 'Failed to create profile' });
    }
  }

  // Handle PUT request - update profile
  if (req.method === 'PUT') {
    try {
      const { 
        profileId, 
        primaryNiche, 
        nicheKeywords, 
        avoidKeywords, // Add this
        noFace, 
        effortLevel, 
        region,
        videoLength,
        preferencesJson 
      } = req.body;
      
      if (!profileId) {
        return res.status(400).json({ error: 'Profile ID required' });
      }

      const keywordsArray = Array.isArray(nicheKeywords) 
        ? nicheKeywords 
        : (nicheKeywords ? nicheKeywords.split(',').map((k: string) => k.trim()) : []);

      const avoidArray = Array.isArray(avoidKeywords) 
        ? avoidKeywords 
        : (avoidKeywords ? avoidKeywords.split(',').map((k: string) => k.trim()) : []);

      const profile = await prisma.userProfile.update({
        where: { id: profileId },
        data: {
          ...(primaryNiche && { primaryNiche }),
          ...(nicheKeywords && { nicheKeywords: JSON.stringify(keywordsArray) }),
          ...(avoidKeywords && { avoidKeywords: JSON.stringify(avoidArray) }), // Add this
          ...(noFace !== undefined && { noFace }),
          ...(effortLevel && { effortLevel }),
          ...(region && { region }),
          ...(videoLength && { videoLength }),
          ...(preferencesJson && { preferencesJson }),
          updatedAt: new Date()
        }
      });

      return res.status(200).json(profile);
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}