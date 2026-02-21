export interface MockTrendItem {
  url: string;
  caption: string;
  hashtags: string[];
  authorName: string;
  authorId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAtSource: Date;
  rawJson: any;
}

export interface MockHashtagItem {
  hashtag: string;
  rank: number;
  views: number;
  rawJson: any;
}

export function generateMockTrends(count: number = 15): MockTrendItem[] {
  const captions = [
    "POV: You're learning React in 2026 #coding #webdev #javascript",
    "3 things every developer should know about AI #tech #programming #ai",
    "Stop using console.log() for debugging #devtips #coding #javascript",
    "How to build a startup in 30 days #entrepreneurship #startup #buildinpublic",
    "React vs Vue vs Svelte - which should you learn? #webdev #javascript #frontend",
    "The future of AI is here and it's absolutely crazy #ai #tech #trending",
    "Building my first SaaS app - day 1 vlog #startup #buildinpublic #coding",
    "Why Web3 is still not ready for mainstream #crypto #bitcoin #tech",
    "Full-stack development tutorial from absolute scratch #programming #coding #webdev",
    "My coding setup tour 2026 - best dev tools #devsetup #productivity #tech",
    "Debugging React performance issues like a pro #react #javascript #performance",
    "How I landed a FAANG job without a CS degree #tech #career #programming",
    "CSS tricks nobody talks about #webdev #frontend #coding #css",
    "TypeScript tutorial for beginners #typescript #programming #javascript",
    "I built an AI app in 24 hours #ai #coding #startup #buildship",
  ];

  const trendHashtags = [
    "#coding", "#webdev", "#javascript", "#ai", "#tech", "#startup",
    "#programming", "#react", "#python", "#devtips", "#entrepreneur",
    "#buildinpublic", "#crypto", "#datasci", "#devlife", "#hacking",
    "#frontend", "#backend", "#fullstack", "#typescript", "#nodejs",
  ];

  const trends: MockTrendItem[] = [];
  for (let i = 0; i < count; i++) {
    const views = Math.floor(Math.random() * 1200000) + 50000;
    const likes = Math.floor(views * (0.02 + Math.random() * 0.08));
    const comments = Math.floor(likes * (0.1 + Math.random() * 0.4));
    const shares = Math.floor(likes * (0.02 + Math.random() * 0.1));

    const caption = captions[i % captions.length];
    const hashtagMatch = caption.match(/#\w+/g) || [];

    trends.push({
      url: `https://www.tiktok.com/@techcreator/video/${1000000 + i}`,
      caption,
      hashtags: hashtagMatch,
      authorName: `creator_${i}`,
      authorId: `user_${i}`,
      views,
      likes,
      comments,
      shares,
      createdAtSource: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      rawJson: { mock: true, id: i, source: "mockGenerator", generatedAt: new Date() },
    });
  }
  return trends;
}

export function generateMockHashtags(count: number = 20): MockHashtagItem[] {
  const hashtags = [
    "coding", "webdev", "javascript", "ai", "tech", "startup",
    "programming", "react", "python", "devtips", "entrepreneur",
    "buildinpublic", "crypto", "datasci", "devlife", "hacking",
    "frontend", "backend", "fullstack", "typescript", "nodejs",
  ];

  return hashtags.slice(0, count).map((tag, i) => ({
    hashtag: `#${tag}`,
    rank: i + 1,
    views: Math.floor(Math.random() * 5000000) + 100000,
    rawJson: { mock: true, hashtag: tag, source: "mockGenerator" },
  }));
}
