// lib/nicheScore.ts

// Export the ScoredVideo type
export type ScoredVideo = {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnails: any;
  tags: string[];
  categoryId: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  matchedTerms: string[];
  relevanceScore: number;
};

export function scoreTrendingByNiche(videos: any[], searchTerms: string | string[]): ScoredVideo[] {
  const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  
  return videos.map(video => {
    const titleLower = video.title?.toLowerCase() || '';
    const descriptionLower = video.description?.toLowerCase() || '';
    const tagsLower = (video.tags || []).map((t: string) => t.toLowerCase());
    
    const matchedTerms: string[] = [];
    let matchCount = 0;
    let relevanceScore = 0;

    // Check each search term
    terms.forEach(term => {
      const termLower = term.toLowerCase();
      let termMatches = 0;
      
      // Check title (highest weight)
      if (titleLower.includes(termLower)) {
        termMatches += 3;
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }
      
      // Check tags (medium weight)
      if (tagsLower.some(tag => tag.includes(termLower))) {
        termMatches += 2;
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }
      
      // Check description (lower weight)
      if (descriptionLower.includes(termLower)) {
        termMatches += 1;
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }
      
      matchCount += termMatches;
    });

    // Calculate base relevance score (0-1)
    if (terms.length > 0) {
      relevanceScore = Math.min(matchCount / (terms.length * 3), 1);
    }

    // Boost score based on engagement (view count as proxy for trending)
    const viewBoost = video.viewCount ? Math.min(Math.log10(video.viewCount) / 7, 0.3) : 0;
    
    // Final score combines relevance and trending factor
    const finalScore = relevanceScore * 0.7 + viewBoost * 0.3;

    return {
      videoId: video.videoId,
      title: video.title,
      description: video.description,
      channelTitle: video.channelTitle,
      channelId: video.channelId,
      publishedAt: video.publishedAt,
      thumbnails: video.thumbnails,
      tags: video.tags || [],
      categoryId: video.categoryId,
      viewCount: video.viewCount || 0,
      likeCount: video.likeCount || 0,
      commentCount: video.commentCount || 0,
      matchedTerms,
      relevanceScore: finalScore,
    };
  });
}