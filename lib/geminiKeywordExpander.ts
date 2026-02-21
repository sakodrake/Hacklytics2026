// lib/geminiKeywordExpander.ts
// Use Gemini to expand user keywords into better search terms

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function expandKeywordsWithGemini(
  niche: string,
  userKeywords: string[],
  avoidKeywords: string[] = []
): Promise<{
  searchTerms: string[];
  expandedQuery: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback to original keywords if no Gemini
    return {
      searchTerms: userKeywords,
      expandedQuery: userKeywords.join(' OR ')
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a YouTube search expert. Help me create effective search queries for finding trending videos in a specific niche.

Niche: "${niche}"
User's keywords: ${userKeywords.join(', ')}
Topics to avoid: ${avoidKeywords.length ? avoidKeywords.join(', ') : 'none'}

Task: Generate 10-15 specific search terms/phrases that would find trending, high-quality videos in this niche. 
Consider:
- Popular formats in this niche
- Common search terms viewers use
- Trending topics within this niche
- Avoid the "avoid" topics

Return ONLY a JSON array of strings, nothing else:
["term 1", "term 2", "term 3", ...]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found");
    }
    
    const expandedTerms = JSON.parse(jsonMatch[0]);
    
    // Combine original and expanded terms (remove duplicates)
    const allTerms = [...new Set([...userKeywords, ...expandedTerms])];
    
    return {
      searchTerms: allTerms,
      expandedQuery: allTerms.join(' OR ')
    };
  } catch (error) {
    console.error('Gemini keyword expansion failed:', error);
    return {
      searchTerms: userKeywords,
      expandedQuery: userKeywords.join(' OR ')
    };
  }
}