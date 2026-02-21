import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Syne } from 'next/font/google'
import TrendCard from '../components/TrendCard'

const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' })

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Failed to fetch')
  return r.json()
})

export default function Feed() {
  const router = useRouter()
  const [profileId, setProfileId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastFetch, setLastFetch] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  // live trends state (mapped to TrendCard shape)
  const [trends, setTrends] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem('trendspinoff_profileId')
    const profileJson = localStorage.getItem('trendspinoff_profile')
    if (!id || !profileJson) {
      router.push('/onboarding')
      return
    }
    setProfileId(id)

    // initial fetch
    try {
      const profile = JSON.parse(profileJson)
      const niche = (profile.primaryNiche || '').trim()
      fetchLiveTrends(niche)
    } catch (e) {
      // fallback: still try to fetch without niche
      fetchLiveTrends('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function fetchLiveTrends(niche: string) {
    setIsLoading(true)
    setRefreshing(true)
    setError('')
    try {
      // build keywords from primary niche + interests saved in profile
      const profile = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('trendspinoff_profile') || '{}') : {}
      const interests = Array.isArray(profile?.interests) ? profile.interests : []
      const keywords = [niche, ...interests].filter(Boolean)
      const q = niche ? `?niche=${encodeURIComponent(niche)}` : ''
      const kq = keywords.length ? `${q ? '&' : '?'}keywords=${encodeURIComponent(keywords.join(','))}` : ''
      const response = await fetch(`/api/youtube-trends${q}${kq}`)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to fetch youtube trends')
      }
      const data = await response.json()

      // Map youtube-trends response into shape TrendCard expects
      const mapped = (data.videos || []).map((v: any) => ({
        id: v.videoId,
        caption: v.title,
        hashtags: v.tags || [],
        views: v.viewCount || 0,
        likes: v.likeCount || 0,
        comments: v.commentCount || 0,
        shares: v.shareCount || 0,
        scores: {
          final: typeof v.relevanceScore === 'number' ? Math.round(v.relevanceScore) : (v.relevanceScore ?? 0),
          match: 0,
          velocity: 0,
          replicability: 0
        },
        reasons: {
          matchReasons: v.matchedTerms || [],
          replicabilityReasons: []
        }
      }))

      setTrends(mapped)
      setLastFetch(new Date().toLocaleString())
      setIsDemo(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching live trends')
    } finally {
      setRefreshing(false)
      setIsLoading(false)
    }
  }

  async function refreshTrends() {
    // refresh using stored profile if possible
    const profileJson = localStorage.getItem('trendspinoff_profile')
    let niche = ''
    if (profileJson) {
      try { niche = JSON.parse(profileJson).primaryNiche || '' } catch { niche = '' }
    }
    await fetchLiveTrends(niche)
  }

  if (!profileId) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <p className="page-subtitle">Redirecting...</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center p-6">
        <p className="text-red-300">{error}. Try refreshing.</p>
      </div>
    )
  }
  if (isLoading) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <p className="page-subtitle">Loading trends...</p>
      </div>
    )
  }

  const fetchedAt = lastFetch || 'Never'
  const videoCount = trends.length || 0
  const hashtagCount = 0

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="app-bg absolute inset-0 -z-10" aria-hidden />
      <div className="relative min-h-screen p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="link-muted text-sm transition-colors">
              ← Home
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className={`${syne.className} page-title text-4xl sm:text-5xl mb-2`}>
              TrendSpinoff Feed
            </h1>
            <p className="page-subtitle text-lg">
              Discover trending videos tailored to your style and niche
            </p>
          </div>

          <div className="app-card p-4 sm:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1 text-slate-700">
                <p className="text-sm">
                  <span className="font-semibold">Last fetched:</span> {fetchedAt}
                  {isDemo && (
                    <span className="ml-2 inline-block px-2 py-1 bg-slate-200 text-slate-800 text-xs rounded-lg">
                      Demo Mode
                    </span>
                  )}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Records:</span> {videoCount} videos, {hashtagCount} hashtags
                </p>
              </div>
              <button
                onClick={refreshTrends}
                disabled={refreshing}
                className="btn-primary px-6 py-3 shrink-0"
              >
                {refreshing ? 'Fetching...' : 'Refresh Trends'}
              </button>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>

          {trends.length === 0 ? (
            <div className="app-card p-12 text-center">
              <p className="text-slate-700 mb-6">No trends loaded yet. Click below to fetch live data.</p>
              <button onClick={refreshTrends} className="btn-primary px-8 py-4 text-lg">
                Fetch Live Trends
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {trends.map((t: any) => (
                <TrendCard key={t.id} trend={t} profileId={profileId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
