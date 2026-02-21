import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import useSWR, { mutate } from 'swr'
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

  useEffect(() => {
    const id = localStorage.getItem('trendspinoff_profileId')
    if (!id) {
      router.push('/onboarding')
      return
    }
    setProfileId(id)
  }, [router])

  const { data, error: fetchError, isLoading } = useSWR(
    profileId ? `/api/trends?profileId=${profileId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  async function refreshTrends() {
    if (!profileId) return
    setRefreshing(true)
    setError('')
    try {
      const response = await fetch('/api/trends/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to refresh')
      }

      const result = await response.json()
      setLastFetch(new Date(result.fetchedAt).toLocaleString())
      setIsDemo(result.demo || false)
      mutate(`/api/trends?profileId=${profileId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error refreshing trends')
    } finally {
      setRefreshing(false)
    }
  }

  if (!profileId) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <p className="page-subtitle">Redirecting...</p>
      </div>
    )
  }
  if (fetchError) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center p-6">
        <p className="text-red-300">Failed to load trends. Try refreshing.</p>
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

  const trends = data?.trends || []
  const fetchedAt = data?.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : 'Never'
  const videoCount = data?.counts?.videoCount || 0
  const hashtagCount = data?.counts?.hashtagCount || 0

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
