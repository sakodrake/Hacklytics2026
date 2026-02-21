import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

interface ProfileRequest {
  primaryNiche?: string;
  interests?: string[];
  goals?: string[];
  style?: string[];
  noFace?: boolean;
  effortLevel?: string;
  videoLength?: number
}

interface GeminiResponse {
  primaryNiche: string;
  nicheKeywords: string[];
  avoidKeywords: string[];
  hashtagSeeds: string[];
}

// Best-effort JSON parse helper
function safeJsonParse(text: string | undefined): any | null {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function generateKeywordsWithGemini(preferences: ProfileRequest): Promise<GeminiResponse> {
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
- Target Video Length: ${preferences.videoLength || 30} seconds

Generate a JSON object with ONLY these fields (no markdown, no explanation):
{
  "primaryNiche": "${niche}",
  "nicheKeywords": ["..."],
  "avoidKeywords": ["..."],
  "hashtagSeeds": ["..."]
}

Focus on relevant content for this ${niche} niche. Ensure keywords are lowercase, relevant, and actionable for content creators.`;

  // 1) Try SDK if available and key present
  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
      // allow overriding model via env; otherwise let SDK pick sensible default
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.0';
      const model = client.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt as any);
      const text = typeof result?.response?.text === 'function' ? result.response.text() : String(result?.response ?? '');
      const parsed = safeJsonParse(text);
      if (parsed && typeof parsed === 'object') {
        return {
          primaryNiche: parsed.primaryNiche || niche,
          nicheKeywords: Array.isArray(parsed.nicheKeywords) ? parsed.nicheKeywords.slice(0, 40) : [],
          avoidKeywords: Array.isArray(parsed.avoidKeywords) ? parsed.avoidKeywords : [],
          hashtagSeeds: Array.isArray(parsed.hashtagSeeds) ? parsed.hashtagSeeds : []
        };
      }
    } catch (err) {
      console.error('Gemini SDK error:', String((err as any)?.message ?? err));
      // fallthrough to REST fallback or local fallback
    }
  }

  // 2) REST fallback using GEMINI_API_URL if provided
  if (process.env.GEMINI_API_URL && process.env.GEMINI_API_KEY) {
    try {
      const res = await fetch(process.env.GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const bodyText = await res.text().catch(() => '');
      // try to parse any JSON block
      const parsed = safeJsonParse(bodyText) || safeJsonParse((await (async () => { try { return JSON.parse(bodyText)?.candidates?.[0]?.content ?? null } catch { return null } })()) as any);
      if (parsed && typeof parsed === 'object') {
        return {
          primaryNiche: parsed.primaryNiche || niche,
          nicheKeywords: Array.isArray(parsed.nicheKeywords) ? parsed.nicheKeywords.slice(0, 40) : [],
          avoidKeywords: Array.isArray(parsed.avoidKeywords) ? parsed.avoidKeywords : [],
          hashtagSeeds: Array.isArray(parsed.hashtagSeeds) ? parsed.hashtagSeeds : []
        };
      }
    } catch (err) {
      console.error('Gemini REST error:', String((err as any)?.message ?? err));
    }
  }

  // 3) Local fallback keywords
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const body: ProfileRequest = req.body;
    
    // Generate keywords using Gemini
    const geminiResponse = await generateKeywordsWithGemini(body);

    // Coerce videoLength to integer (Prisma expects Int)
    const rawVideoLength = (body as any).videoLength ?? process.env.DEFAULT_VIDEO_LENGTH ?? 30;
    const videoLengthInt = Number.isFinite(Number(rawVideoLength)) ? Math.max(0, parseInt(String(rawVideoLength), 10)) : 30;

    // Region: prefer explicit body.region, then env, else null
    const regionValue = (body as any).region ?? process.env.YOUTUBE_REGION ?? null;

    // Create profile with JSON as serialized strings
    const profile = await prisma.userProfile.create({
      // cast to any to avoid TS mismatches with generated Prisma types in some environments
      data: ({
        preferencesJson: JSON.stringify(body),
        primaryNiche: geminiResponse.primaryNiche || (body.primaryNiche ?? 'tech'),
        nicheKeywords: JSON.stringify(geminiResponse.nicheKeywords ?? []),
        avoidKeywords: JSON.stringify(geminiResponse.avoidKeywords ?? []),
        noFace: Boolean(body.noFace ?? false),
        effortLevel: String(body.effortLevel ?? 'med'),
        videoLength: videoLengthInt,
        region: regionValue ?? null
      } as any)
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
