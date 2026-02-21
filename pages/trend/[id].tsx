import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import SpinoffPanel from '../../components/SpinoffPanel'
import ScoreBadge from '../../components/ScoreBadge'

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Failed to fetch')
  return r.json()
})

export default function TrendDetail(){
  const router = useRouter()
  const { id, profileId } = router.query
  const [spinoffs, setSpinoffs] = useState<any[] | null>(null)
  const [spinoffLoading, setSpinoffLoading] = useState(false)
  const [spinoffError, setSpinoffError] = useState('')
  const [showRawJson, setShowRawJson] = useState(false)

  const { data, error, isLoading } = useSWR(
    profileId && id ? `/api/trends?profileId=${profileId}` : null,
    fetcher
  )

  const trend = data?.trends?.find((t: any) => t.id === id)
  const profileIdStr = typeof profileId === 'string' ? profileId : null

  async function generateSpinoffs() {
    if (!profileIdStr || !id) return
    
    setSpinoffLoading(true)
    setSpinoffError('')
    try {
      const response = await fetch('/api/spinoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profileIdStr, trendId: id })
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Failed to generate spinoffs')
      }
      
      const result = await response.json()
      setSpinoffs(result.spinoffs)
    } catch (err) {
      setSpinoffError(err instanceof Error ? err.message : 'Error generating spinoffs')
    } finally {
      setSpinoffLoading(false)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen app-bg flex items-center justify-center">
      <p className="page-subtitle">Loading trend...</p>
    </div>
  )
  if (error || !trend) return (
    <div className="min-h-screen app-bg flex items-center justify-center p-6">
      <p className="text-red-300">Trend not found</p>
    </div>
  )

  const scores = trend.scores || { match: 0, velocity: 0, replicability: 0, final: 0 }
  const reasons = trend.reasons || { matchReasons: [], replicabilityReasons: [] }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="app-bg absolute inset-0 -z-10" aria-hidden />
      <div className="relative min-h-screen p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 link-muted hover:text-white font-medium transition-colors"
          >
            ← Back
          </button>

          <div className="app-card p-6 md:p-8">
          {/* Campaign Info */}
          <div className="mb-6">
            <p className="text-sm text-slate-600 line-clamp-3 mb-3">
              {trend.caption || 'No caption available'}
            </p>
            
            {/* Hashtags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {trend.hashtags?.slice(0, 5).map((h: string) => (
                <span key={h} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {h.startsWith('#') ? h : `#${h}`}
                </span>
              ))}
            </div>
          </div>

          {/* Score Section */}
          <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-5 mb-6">
            <h3 className="font-semibold text-slate-800 mb-3">Performance Scores</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{scores.match}</div>
                <div className="text-xs text-slate-600">Match</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{scores.velocity}</div>
                <div className="text-xs text-slate-600">Velocity</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{scores.replicability}</div>
                <div className="text-xs text-slate-600">Replicability</div>
              </div>
              <div className="text-center bg-white rounded p-3">
                <div className="text-3xl font-bold text-slate-800">{scores.final}</div>
                <div className="text-xs text-slate-600">FINAL</div>
              </div>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-50 p-4 rounded">
              <div className="text-sm text-slate-600">Views</div>
              <div className="text-xl font-bold text-slate-800">{trend.views?.toLocaleString() || '—'}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded">
              <div className="text-sm text-slate-600">Likes</div>
              <div className="text-xl font-bold text-slate-800">{trend.likes?.toLocaleString() || '—'}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded">
              <div className="text-sm text-slate-600">Comments</div>
              <div className="text-xl font-bold text-slate-800">{trend.comments?.toLocaleString() || '—'}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded">
              <div className="text-sm text-slate-600">Shares</div>
              <div className="text-xl font-bold text-slate-800">{trend.shares?.toLocaleString() || '—'}</div>
            </div>
          </div>

          {/* Match & Replicability Reasons */}
          {(reasons.matchReasons?.length > 0 || reasons.replicabilityReasons?.length > 0) && (
            <div className="bg-slate-50 p-4 rounded-lg mb-6 space-y-2">
              {reasons.matchReasons?.length > 0 && (
                <p className="text-sm">
                  <span className="font-semibold text-slate-800">Why it matches:</span>{' '}
                  <span className="text-slate-700">{reasons.matchReasons.join(', ')}</span>
                </p>
              )}
              {reasons.replicabilityReasons?.length > 0 && (
                <p className="text-sm">
                  <span className="font-semibold text-slate-800">Replicability factors:</span>{' '}
                  <span className="text-slate-700">{reasons.replicabilityReasons.join(', ')}</span>
                </p>
              )}
            </div>
          )}

          {/* Generate Spinoffs Button */}
          <div className="mb-6">
            <button
              onClick={generateSpinoffs}
              disabled={spinoffLoading}
              className="btn-primary w-full px-6 py-4 text-lg"
            >
              {spinoffLoading ? 'Generating...' : '✨ Generate My Spinoff Ideas'}
            </button>
            {spinoffError && <p className="text-red-600 text-sm mt-2">{spinoffError}</p>}
          </div>

          {/* Spinoffs */}
          {spinoffs && (
            <div className="mt-6">
              <SpinoffPanel spinoffs={spinoffs} />
            </div>
          )}

          {/* Raw JSON Viewer */}
          <div className="mt-8 border-t pt-6">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-sm px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition"
            >
              {showRawJson ? 'Hide' : 'Show'} Raw JSON
            </button>
            {showRawJson && (
              <pre className="bg-slate-50 p-4 rounded mt-3 overflow-auto max-h-64 text-xs text-slate-700">
                {JSON.stringify(trend, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
