import Link from 'next/link'
import ScoreBadge from './ScoreBadge'

export default function TrendCard({ trend, profileId }: { trend: any; profileId?: string }) {
  const scores = trend.scores || { match: 0, velocity: 0, replicability: 0, final: 0 }
  const reasons = trend.reasons || { matchReasons: [], replicabilityReasons: [] }

  return (
    <div className="app-card p-5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.22)] transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <p className="text-sm text-slate-500 line-clamp-2">{trend.caption || 'No caption'}</p>
          <div className="mt-2 flex gap-2">
            {trend.hashtags?.slice(0, 3).map((h: string) => (
              <span key={h} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                {h.startsWith('#') ? h : `#${h}`}
              </span>
            ))}
          </div>
        </div>
        <div className="ml-4 text-right">
          <div className="text-lg font-bold text-slate-800">{scores.final}</div>
          <div className="text-xs text-slate-500">FINAL SCORE</div>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200 text-xs text-slate-600">
        <div>
          <div className="font-semibold text-slate-800">{trend.views?.toLocaleString() || 0}</div>
          <div>Views</div>
        </div>
        <div>
          <div className="font-semibold text-slate-800">{trend.likes?.toLocaleString() || 0}</div>
          <div>Likes</div>
        </div>
        <div>
          <div className="font-semibold text-slate-800">{trend.comments?.toLocaleString() || 0}</div>
          <div>Comments</div>
        </div>
      </div>

      {/* Score Badges */}
      <div className="mt-3 flex gap-2 flex-wrap">
        <ScoreBadge label="Match" value={scores.match} />
        <ScoreBadge label="Velocity" value={scores.velocity} />
        <ScoreBadge label="Replicability" value={scores.replicability} />
      </div>

      {/* Reasons */}
      {reasons.matchReasons && reasons.matchReasons.length > 0 && (
        <p className="mt-2 text-xs text-slate-600">
          <span className="font-semibold">Match:</span> {reasons.matchReasons.join(', ')}
        </p>
      )}

      {/* View Link */}
      <div className="mt-4 flex justify-end">
        <Link href={`/trend/${trend.id}${profileId ? `?profileId=${profileId}` : ''}`} className="text-blue-600 hover:text-blue-800 font-medium">
          View Details →
        </Link>
      </div>
    </div>
  )
}
