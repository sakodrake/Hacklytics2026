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
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-3">Performance Scores</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50/80 p-4 text-center shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold text-blue-700">{scores.match}</div>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className="text-xs font-medium text-slate-700">Match</span>
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-200/80 text-blue-800 text-[10px] font-bold cursor-help"
                    title="How well this trend aligns with your niche and keywords."
                    aria-label="Match score description"
                  >
                    ?
                  </span>
                </div>
              </div>
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/80 p-4 text-center shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-700">{scores.velocity}</div>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className="text-xs font-medium text-slate-700">Velocity</span>
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-200/80 text-emerald-800 text-[10px] font-bold cursor-help"
                    title="Engagement momentum: views, likes, comments, and shares."
                    aria-label="Velocity score description"
                  >
                    ?
                  </span>
                </div>
              </div>
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50/80 p-4 text-center shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold text-amber-700">{scores.replicability}</div>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className="text-xs font-medium text-slate-700">Replicability</span>
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-200/80 text-amber-800 text-[10px] font-bold cursor-help"
                    title="How easy it is for you to replicate this trend (effort, no-face, format)."
                    aria-label="Replicability score description"
                  >
                    ?
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="rounded-xl border-2 border-slate-300 bg-slate-100 px-8 py-4 text-center shadow-sm min-w-[140px]">
                <div className="text-3xl font-bold text-slate-800">{scores.final}</div>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Final</span>
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-300 text-slate-700 text-[10px] font-bold cursor-help"
                    title="Combined score: 45% Match, 35% Velocity, 20% Replicability."
                    aria-label="Final score description"
                  >
                    ?
                  </span>
                </div>
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
