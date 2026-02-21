# YouTube Trending 12 Niche Filter 12 Gemini Pattern Extraction (Copilot-ready)

## Goal
Use YouTube Data API to pull **global trending** videos, then:
- filter/sort by a user's niche keyword (ex: "fitness", "study tips", "streetwear"),
- pass the best matches into Gemini to extract:
  - repeated hooks
  - common formats (POV, listicle, challenge, reaction, etc.)
  - editing patterns
  - title/thumbnail patterns
  - repeatable "templates" the creator can copy

## Whats implemented
### Endpoint
`GET /api/youtube-trends?niche=<string>&region=<optional>`

Returns JSON:
```json
{
  "niche": "fitness motivation",
  "region": "US",
  "source": "youtube_mostPopular",
  "videos": [ { "videoId": "...", "title": "...", "channelTitle": "...", "publishedAt": "...", "viewCount": 123, "likeCount": 45, "commentCount": 6, "tags": ["..."], "matchedTerms": ["fitness","workout"], "relevanceScore": 0.72 } ],
  "patterns": {
    "hooks": ["..."],
    "formats": ["..."],
    "editing": ["..."],
    "titles": ["..."],
    "thumbnails": ["..."],
    "templateIdeas": ["..."],
    "doNext": ["..."]
  }
}
```

## Why this approach (hackathon-friendly)
- YouTube has a clean 8mostPopular chart for trending by region (`videos.list?chart=mostPopular&regionCode=...`).
- We keep ctrend scoring logic light: just compute a relevance score from title/description/tags + basic engagement.
- Gemini does the *real* value-add: turning trending examples into actionable content templates.

## Notes / Limits
- Trending is **regional**, not globally universal. Use `YOUTUBE_REGION=US` for demo.
- Quota: `search.list` is expensive; we avoid it and use `videos.list` instead whenever possible.
