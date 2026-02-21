import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ProfileRequest {
  primaryNiche?: string;
  interests?: string[];
  goals?: string[];
  style?: string[];
  noFace?: boolean;
  effortLevel?: string;
}

interface GeminiResponse {
  primaryNiche: string;
  nicheKeywords: string[];
  avoidKeywords: string[];
  hashtagSeeds: string[];
}

async function generateKeywordsWithGemini(preferences: ProfileRequest): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }
  
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const niche = preferences.primaryNiche || 'tech';
  const interests = (preferences.interests || []).join(', ') || 'general';
  const goals = (preferences.goals || []).join(', ') || 'engagement';
  const style = (preferences.style || []).join(', ') || 'educational';
  
  const prompt = `You are a TikTok trend analysis expert. Based on the user's preferences, generate a JSON object with niche keywords, avoid keywords, and hashtag seeds.

User Preferences:
- Primary Niche: ${niche}
- Interests: ${interests}
- Goals: ${goals}
- Style: ${style}
- No-Face Videos: ${preferences.noFace ? 'Yes' : 'No'}
- Effort Level: ${preferences.effortLevel || 'medium'}

Generate a JSON object with ONLY these fields (no markdown, no explanation):
{
  "primaryNiche": "${niche}",
  "nicheKeywords": [20-40 relevant keywords for content creators in this niche],
  "avoidKeywords": [5-10 keywords to avoid],
  "hashtagSeeds": [10-15 popular hashtag seeds]
}

Focus on TECH-related content for this ${niche} niche. Ensure keywords are lowercase, relevant, and actionable for content creators.`;
  
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }
    
    const parsed: GeminiResponse = JSON.parse(jsonMatch[0]);
    
    // Validate and clean
    return {
      primaryNiche: parsed.primaryNiche || niche,
      nicheKeywords: Array.isArray(parsed.nicheKeywords) ? parsed.nicheKeywords.slice(0, 40) : [],
      avoidKeywords: Array.isArray(parsed.avoidKeywords) ? parsed.avoidKeywords : [],
      hashtagSeeds: Array.isArray(parsed.hashtagSeeds) ? parsed.hashtagSeeds : []
    };
  } catch (error) {
    console.error('Gemini error:', error);
    
    // Fallback keywords for tech niche
    const techKeywords = [
      'coding', 'python', 'javascript', 'react', 'web development', 'full stack',
      'ai', 'machine learning', 'data science', 'api design', 'databases', 'sql',
      'debugging', 'dev tips', 'tech stack', 'startup', 'innovation', 'github',
      'typescript', 'nodejs', 'frontend', 'backend', 'devops', 'cloud',
      'open source', 'tutorial', 'coding challenge', 'web design', 'ux',
      'performance', 'optimization', 'security', 'best practices', 'code review'
    ];
    
    return {
      primaryNiche: niche,
      nicheKeywords: techKeywords,
      avoidKeywords: ['scam', 'fake', 'misleading', 'spam'],
      hashtagSeeds: ['#coding', '#webdev', '#python', '#react', '#javascript', '#devlife', '#programming']
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const body: ProfileRequest = req.body;
    
    // Generate keywords using Gemini
    const geminiResponse = await generateKeywordsWithGemini(body);
    
    // Create profile with JSON as serialized strings
    const profile = await prisma.userProfile.create({
      data: {
        preferencesJson: JSON.stringify(body),
        primaryNiche: geminiResponse.primaryNiche,
        nicheKeywords: JSON.stringify(geminiResponse.nicheKeywords),
        avoidKeywords: JSON.stringify(geminiResponse.avoidKeywords),
        noFace: body.noFace || false,
        effortLevel: body.effortLevel || 'med',
        region: body.primaryNiche === 'tech' ? 'US' : undefined
      }
    });
    
    return res.status(201).json({
      profileId: profile.id,
      primaryNiche: profile.primaryNiche,
      nicheKeywords: geminiResponse.nicheKeywords,
      avoidKeywords: geminiResponse.avoidKeywords,
      noFace: profile.noFace,
      effortLevel: profile.effortLevel
    });
  } catch (error) {
    console.error('Error in /api/profile:', error);
    return res.status(500).json({
      error: 'Failed to create profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
