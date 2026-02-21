import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useSWR, { mutate } from 'swr'
import TrendCard from '../components/TrendCard'

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Failed to fetch')
  return r.json()
})

export default function Feed(){
  const router = useRouter()
  const [profileId, setProfileId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastFetch, setLastFetch] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  // Load profileId from localStorage on mount
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
      
      // Revalidate trends
      mutate(`/api/trends?profileId=${profileId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error refreshing trends')
    } finally {
      setRefreshing(false)
    }
  }

  if (!profileId) return <div className="p-6 text-center">Redirecting...</div>
  if (fetchError) return <div className="p-6 text-center text-red-600">Failed to load trends. Try refreshing.</div>
  if (isLoading) return <div className="p-6 text-center">Loading trends...</div>

  const trends = data?.trends || []
  const fetchedAt = data?.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : 'Never'
  const videoCount = data?.counts?.videoCount || 0
  const hashtagCount = data?.counts?.hashtagCount || 0

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">TrendSpinoff Feed</h1>
          <p className="text-slate-600">Discover trending videos tailored to your style and niche</p>
        </div>

        {/* Info and Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Last fetched:</span> {fetchedAt}
                {isDemo && <span className="ml-2 inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Demo Mode</span>}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Records:</span> {videoCount} videos, {hashtagCount} hashtags
              </p>
            </div>
            <button
              onClick={refreshTrends}
              disabled={refreshing}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition"
            >
              {refreshing ? 'Fetching...' : 'Refresh Trends'}
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>

        {/* Trends List */}
        {trends.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-slate-600 mb-4">No trends loaded yet. Click "Refresh Trends" to fetch live data.</p>
            <button
              onClick={refreshTrends}
              className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
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
  )
}
