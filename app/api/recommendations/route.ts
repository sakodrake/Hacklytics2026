import { NextResponse } from 'next/server'
import type { UserProfile } from '../../../src/types/userProfile'
import type { RecommendationsResponse, Recommendation } from '../../../src/types/recommendation'
import fs from 'fs'
import path from 'path'

type TrendItem = {
  url: string
  caption: string
  hashtags: string[]
  views: number
  likes: number
  comments: number
  shares?: number
  video_style?: string
  video_length_seconds?: number
  hook_text?: string
}

const STYLES = ['educational', 'talking-head', 'meme', 'storytelling', 'slideshow', 'screen-recording', 'text-overlay']

function assignStyleForTrend(t: TrendItem) {
  // simple heuristic: presence of #coding/#javascript => educational, #ai/#tech => educational/meme
  // prefer explicit video_style when available
  if (t.video_style) return t.video_style
  const caps = (t.caption || '').toLowerCase()
  if (caps.includes('#meme') || caps.includes('meme')) return 'meme'
  if (caps.includes('#ai') || caps.includes('#tech')) return 'educational'
  if (caps.includes('vlog') || caps.includes('vlog')) return 'storytelling'
  if ((t.hashtags || []).length >= 3) return 'text-overlay'
  return STYLES[Math.floor(Math.random() * STYLES.length)]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const profile: UserProfile = {
      primaryNiche: body.primaryNiche,
      interests: body.interests || [],
      preferredStyle: Array.isArray(body.style) ? body.style[0] : body.preferredStyle || body.style || body.preferredStyle,
      noFace: !!body.noFace,
      effortLevel: body.effortLevel || 'med',
      preferredLengthSeconds: Number(body.videoLength ?? body.preferredLengthSeconds ?? 30)
    }

    // load data/data.json produced from your CSV converter
    const dataPath = path.join(process.cwd(), 'data', 'data.json')
    let rawTrends: any[] = []
    try {
      const txt = fs.readFileSync(dataPath, 'utf8')
      rawTrends = JSON.parse(txt)
    } catch (e) {
      // fallback to empty
      rawTrends = []
    }

    const trends: TrendItem[] = rawTrends.map(r => ({
      url: r.video_url || r.videoUrl || r.url || '',
      caption: (r.topic || r.hook_text || r.caption || '').toString(),
      hashtags: Array.isArray(r.hashtags) ? r.hashtags : ((r.hashtags || '').toString().split(/;|,|\s+/).filter(Boolean).map((h: string) => h.startsWith('#') ? h : `#${h}`)),
      views: Number(r.views || 0),
      likes: Number(r.likes || 0),
      comments: Number(r.comments || 0),
      shares: Number(r.shares || 0),
      video_style: r.video_style || r.style || undefined,
      video_length_seconds: Number(r.video_length_seconds || r.video_length || r.length || 0),
      hook_text: r.hook_text || r.hook || ''
    }))

    const scored = trends.map(t => {
      const style = assignStyleForTrend(t)
      const lengthSec = t.video_length_seconds && Number(t.video_length_seconds) > 0 ? Number(t.video_length_seconds) : (15 + Math.floor(Math.random() * 90))

      const engagement = (t.likes + t.comments + (t.shares || 0))
      const engagementRate = t.views > 0 ? engagement / t.views : 0
      const virality = (t.shares || 0) * 2 + (t.likes || 0) * 0.5 + (t.comments || 0) * 1

      let score = 0

      // Primary niche match (mock: check presence in caption)
      if ((t.caption || '').toLowerCase().includes(profile.primaryNiche?.toLowerCase() || '')) score += 50

      // Interests overlap
      for (const it of profile.interests || []) {
        if ((t.caption || '').toLowerCase().includes(it.toLowerCase())) score += 8
      }

      // Style match
      if (profile.preferredStyle && style.toLowerCase().includes(profile.preferredStyle.toLowerCase())) score += 10

      // noFace preference
      if (profile.noFace) {
        if (['slideshow', 'screen-recording', 'text-overlay'].includes(style)) score += 12
        else score -= 5
      }

      // effort level
      if (profile.effortLevel === 'low') {
        if (['text-overlay', 'slideshow'].includes(style)) score += 10
        if (style === 'talking-head') score -= 8
      } else if (profile.effortLevel === 'med') {
        if (['screen-recording', 'text-overlay'].includes(style)) score += 6
      } else if (profile.effortLevel === 'high') {
        if (style === 'talking-head') score += 10
      }

      // length preference
      if (Math.abs(lengthSec - profile.preferredLengthSeconds) <= 10) score += 8
      else score -= Math.min(6, Math.abs(lengthSec - profile.preferredLengthSeconds) / 10)

      // performance boosts
      score += engagementRate * 100
      score += Math.log10(Math.max(1, virality))

      return {
        raw: t,
        score,
        style,
        lengthSec,
        engagementRate
      }
    })

    scored.sort((a, b) => b.score - a.score)

    const top = scored.slice(0, 5).map(s => {
      const t = s.raw
      const hashtags = (t.hashtags || []).slice(0, 6)
      const personalTouch: string[] = []

      // Personalization bullets
      personalTouch.push(`Mention ${profile.primaryNiche} in the first 3 seconds`)
      if (profile.interests && profile.interests.length) personalTouch.push(`Tie the hook to ${profile.interests[0]}`)
      if (profile.noFace) personalTouch.push('Use screen overlays, captions, and B-roll instead of talking to camera')
      if (profile.effortLevel === 'low') personalTouch.push('Keep edits minimal: quick cuts and text overlays')
      if (profile.preferredStyle) personalTouch.push(`Adopt a ${profile.preferredStyle} tone`) 

      const rec: Recommendation = {
        videoUrl: t.url,
        topic: t.caption?.split('#')[0].trim() || 'Trend',
        niche: profile.primaryNiche || 'General',
        hashtags,
        hook: (t.caption && t.caption.split('#')[0]) || 'Open with a bold statement',
        personalTouch,
        metrics: {
          views: t.views || 0,
          engagementRate: Number((s.engagementRate || 0).toFixed(4)),
          lengthSec: s.lengthSec,
          style: s.style
        }
      }

      return rec
    })

    const response: RecommendationsResponse = { recommendations: top }
    return NextResponse.json(response)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}

export const GET = () => {
  return NextResponse.json({ message: 'POST only' })
}
