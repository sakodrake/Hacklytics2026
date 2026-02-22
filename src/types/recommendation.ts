export interface Recommendation {
  videoUrl: string
  topic: string
  niche: string
  hashtags: string[]
  hook: string
  personalTouch: string[]
  metrics: {
    views: number
    engagementRate: number
    lengthSec: number
    style: string
  }
}

export interface RecommendationsResponse {
  recommendations: Recommendation[]
}

export default Recommendation
