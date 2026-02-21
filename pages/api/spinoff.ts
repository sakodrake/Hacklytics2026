import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Spinoff {
  title: string;
  hook: string;
  beats: string[];
  filmingNotes: string[];
  caption: string;
  hashtags: string[];
  whyItFitsUser: string;
}

function normalizeHashtags(input: unknown): string[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.startsWith("#") ? s : `#${s}`));
  }

  if (typeof input === "string") {
    const s = input.trim();

    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return normalizeHashtags(parsed);
    } catch {
      // not JSON
    }

    return s
      .split(/[\s,]+/g)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => (x.startsWith("#") ? x : `#${x}`));
  }

  return normalizeHashtags(String(input));
}

function normalizeStringList(input: unknown): string[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.map(String).map(s => s.trim()).filter(Boolean);
  }

  if (typeof input === "string") {
    const s = input.trim();

    // JSON string like '["a","b"]'
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return normalizeStringList(parsed);
    } catch {}

    // comma/space separated
    return s.split(/[\s,]+/g).map(x => x.trim()).filter(Boolean);
  }

  return normalizeStringList(String(input));
}

async function generateSpinoffsWithGemini(
  profile: { 
    primaryNiche?: string; 
    nicheKeywords?: string | string[]; // Changed to accept string or string[]
    noFace?: boolean; 
    effortLevel?: string;
  },
  trend: { caption?: string; hashtags?: unknown; views?: number; likes?: number }
): Promise<Spinoff[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const tagList = normalizeHashtags(trend.hashtags);

  // Normalize nicheKeywords - handle both string and array
  const topics = normalizeStringList(profile.nicheKeywords);
  
  const prompt = `You are a TikTok content strategist. Generate 3 ORIGINAL spinoff ideas for this trend.

Original Trend:
- Caption: ${trend.caption || "No description"}
- Hashtags: ${tagList.join(", ") || "general"}
- Engagement: ${trend.views || 0} views, ${trend.likes || 0} likes

User Profile:
- Niche: ${profile.primaryNiche || "tech"}
- Key Topics: ${topics.slice(0, 10).join(", ") || "general"}
- No-Face Videos: ${profile.noFace ? "Yes" : "No"}
- Effort Level: ${profile.effortLevel || "medium"}

Return ONLY a JSON array of 3 spinoff objects with these exact fields (nothing else):
[
  {
    "title": "Creative spinoff title",
    "hook": "Hook line (5-15 words, attention-grabbing)",
    "beats": ["0-5s: Opening hook", "5-15s: Main demonstration", "15-25s: Why it matters", "25-30s: Call-to-action"],
    "filmingNotes": ["Camera angle tips", "Lighting considerations", "Audio tips"],
    "caption": "TikTok caption with call-to-action",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4"],
    "whyItFitsUser": "1-2 sentences explaining why this works for the user"
  }
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array found in Gemini response");

  const parsed: Spinoff[] = JSON.parse(jsonMatch[0]);
  return parsed.filter((s) => s && s.title && s.hook).slice(0, 3);
}

function generateFallbackSpinoffs(
  profile: { 
    primaryNiche?: string; 
    nicheKeywords?: string | string[]; // Changed to accept string or string[]
    effortLevel?: string;
  },
  trend: { caption?: string; hashtags?: unknown }
): Spinoff[] {
  const niche = profile.primaryNiche || "tech";
  const caption = trend.caption || "Trending format";

  const tagList = normalizeHashtags(trend.hashtags);
  const hashtags = tagList.length ? tagList : ["#trend", "#tiktokcreator"];

  return [
    {
      title: "Educational Twist",
      hook: `Teaching the ${niche} behind this format`,
      beats: [
        `0-5s: "Wait, here's the tech behind this..."`,
        "5-15s: Explain the concept in your niche",
        "15-25s: Show real-world application",
        `25-30s: "That's why this format works"`,
      ],
      filmingNotes: ["Screen recording recommended", "Use captions for clarity", "Keep pacing fast"],
      caption: `The tech behind ${caption.substring(0, 30)}... Here's what creators miss. #edtech ${hashtags
        .slice(0, 2)
        .join(" ")}`,
      hashtags: [...hashtags.slice(0, 2), "#learnontiktok", "#teched"],
      whyItFitsUser: `This educational approach aligns with teaching content and works well for ${niche} creators without requiring face time.`,
    },
    {
      title: "Contrarian Take",
      hook: "Why this trend is actually backwards",
      beats: [
        `0-5s: "Everyone's doing this wrong..."`,
        "5-15s: Show the common mistake",
        "15-25s: Reveal the better approach",
        "25-30s: Prove it works",
      ],
      filmingNotes: ["Use split screen for before/after", "Add text overlays for emphasis", "Fast transitions"],
      caption: `Everyone's doing ${caption.substring(0, 25)} the hard way. Here's the shortcut. ${hashtags
        .slice(0, 1)
        .join(" ")} #ProTip`,
      hashtags: [...hashtags.slice(0, 1), "#hacks", "#tipstricks", "#contentcreator"],
      whyItFitsUser: `Contrarian takes generate high engagement and position you as an expert in ${niche}.`,
    },
    {
      title: "Series Hook",
      hook: "Making this a recurring series",
      beats: [
        `0-5s: "Day X of the ${niche} series..."`,
        "5-15s: Unique angle for this day",
        "15-25s: Build curiosity for next video",
        "25-30s: Subscribe for tomorrow's episode",
      ],
      filmingNotes: ["Consistent branding", "Serial numbering in text", "Cliffhanger ending"],
      caption: `Part 1 of my "${niche} series". Tomorrow: even better. ${hashtags.slice(0, 2).join(" ")} #SeriesStarter`,
      hashtags: [...hashtags.slice(0, 2), "#series", "#staytuned"],
      whyItFitsUser: `Series content drives subscriptions and repeat viewers, perfect for ${niche} channels.`,
    },
  ];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { profileId, trendId } = req.body;
    if (!profileId || !trendId) return res.status(400).json({ error: "profileId and trendId required" });

    const [profile, video] = await Promise.all([
      prisma.userProfile.findUnique({ where: { id: profileId } }),
      prisma.trendVideo.findUnique({ where: { id: trendId } }),
    ]);

    if (!profile || !video) return res.status(404).json({ error: "Profile or trend not found" });

    const normalizedVideoHashtags = normalizeHashtags(video.hashtags);

    // Parse nicheKeywords from JSON string if needed
    let nicheKeywordsArray: string[] = [];
    try {
      nicheKeywordsArray = JSON.parse(profile.nicheKeywords);
    } catch (e) {
      nicheKeywordsArray = profile.nicheKeywords ? [profile.nicheKeywords] : [];
    }

    let spinoffs: Spinoff[] = [];
    if (process.env.GEMINI_API_KEY) {
      try {
        spinoffs = await generateSpinoffsWithGemini(
          {
            primaryNiche: profile.primaryNiche,
            nicheKeywords: nicheKeywordsArray, // Pass the parsed array
            noFace: profile.noFace,
            effortLevel: profile.effortLevel,
          },
          {
            caption: video.caption || undefined,
            hashtags: normalizedVideoHashtags,
            views: video.views || undefined,
            likes: video.likes || undefined,
          }
        );
      } catch (err) {
        console.error("Gemini spinoff generation failed, using fallback:", err);
        spinoffs = generateFallbackSpinoffs(
          {
            primaryNiche: profile.primaryNiche,
            nicheKeywords: nicheKeywordsArray, // Pass the parsed array
            effortLevel: profile.effortLevel,
          },
          {
            caption: video.caption || undefined,
            hashtags: normalizedVideoHashtags,
          }
        );
      }
    } else {
      spinoffs = generateFallbackSpinoffs(
        {
          primaryNiche: profile.primaryNiche,
          nicheKeywords: nicheKeywordsArray, // Pass the parsed array
          effortLevel: profile.effortLevel,
        },
        {
          caption: video.caption || undefined,
          hashtags: normalizedVideoHashtags,
        }
      );
    }

    return res.status(200).json({ spinoffs });
  } catch (error) {
    console.error("Error in /api/spinoff:", error);
    return res.status(500).json({
      error: "Failed to generate spinoffs",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}