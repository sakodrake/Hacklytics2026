import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Failed to fetch')
  return r.json()
})

export default function Insights() {
  const router = useRouter()
  const [profileId, setProfileId] = useState<string | null>(null)
  const [showRawData, setShowRawData] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem('trendspinoff_profileId')
    if (!id) {
      router.push('/onboarding')
      return
    }
    setProfileId(id)
  }, [router])

  const { data, error, isLoading } = useSWR(
    profileId ? `/api/insights?profileId=${profileId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!profileId) return <div className="p-6 text-center">Redirecting...</div>
  if (error) return <div className="p-6 text-center text-red-600">Failed to load insights</div>
  if (isLoading) return <div className="p-6 text-center">Loading insights...</div>

  const insights = data || {}
  const topHashtags = insights.topHashtags || []
  const leaderboard = insights.leaderboard || []
  const hookPatterns = insights.hookPatterns || []
  const fetchedAt = insights.fetchedAt ? new Date(insights.fetchedAt).toLocaleString() : 'N/A'

  const hashtagChartData = topHashtags.slice(0, 10).map((h: any) => ({
    name: h.name,
    count: h.count
  }))

  const leaderboardChartData = leaderboard.slice(0, 5).map((t: any) => ({
    name: t.caption?.substring(0, 20) || 'Trend',
    score: t.finalScore
  }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Analytics Dashboard</h1>
        <p className="text-slate-600 mb-6">Real-time trends analysis based on live data</p>

        {/* Meta Info */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Last Updated:</span> {fetchedAt}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-semibold">Analyzed:</span> {insights.counts?.videoCount || 0} videos, {insights.counts?.hashtagCount || 0} hashtags
          </p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Hashtags */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Hashtags</h2>
            {hashtagChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hashtagChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-center py-8">No hashtag data</p>
            )}
          </div>

          {/* Leaderboard / Top Trends by Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Performing Trends</h2>
            {leaderboardChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leaderboardChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-center py-8">No trend data</p>
            )}
          </div>

          {/* Hook Patterns */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Hook Patterns</h2>
            {hookPatterns.length > 0 ? (
              <div className="space-y-3">
                {hookPatterns.slice(0, 6).map((pattern: any) => (
                  <div key={pattern.pattern} className="flex items-center justify-between">
                    <span className="text-slate-700">{pattern.pattern}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (pattern.count / Math.max(...hookPatterns.map((p: any) => p.count))) * 100)}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-slate-600 font-semibold">{pattern.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No pattern data</p>
            )}
          </div>

          {/* Match Score Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Score Distribution</h2>
            {insights.matchHistogram && insights.matchHistogram.some((v: number) => v > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={insights.matchHistogram.map((count: number, idx: number) => ({
                    range: `${idx * 10}-${(idx + 1) * 10}`,
                    count
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-center py-8">No score distribution data</p>
            )}
          </div>
        </div>

        {/* Raw Data Viewer */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Raw Data (for verification)</h2>
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="text-sm px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded transition"
            >
              {showRawData ? 'Hide' : 'Show'}
            </button>
          </div>
          {showRawData && (
            <pre className="bg-slate-50 p-4 rounded overflow-auto max-h-96 text-xs text-slate-700">
              {JSON.stringify(
                {
                  fetchedAt: insights.fetchedAt,
                  counts: insights.counts,
                  topHashtags: topHashtags.slice(0, 5),
                  leaderboard: leaderboard.slice(0, 3)
                },
                null,
                2
              )}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
