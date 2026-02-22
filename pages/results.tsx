import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Syne } from 'next/font/google'
import RecommendationsList from '../components/RecommendationsList'
import type { Recommendation } from '../src/types/recommendation'

const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' })

export default function Results() {
  const [recs, setRecs] = useState<Recommendation[] | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('trendspinoff_recs')
      if (raw) {
        const parsed = JSON.parse(raw)
        setRecs(parsed.recommendations || [])
      } else {
        setRecs([])
      }
    } catch (e) {
      setRecs([])
    }
  }, [])

  if (recs === null) return <div className="p-6 text-center">Loading results…</div>

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className={`${syne.className} text-2xl font-bold`}>Recommendations</h1>
          <Link href="/onboarding" className="text-sm text-slate-600 hover:underline">Edit profile</Link>
        </div>

        {recs.length === 0 ? (
          <div className="app-card p-6 text-center">
            <p className="mb-3 text-slate-700">No recommendations found.</p>
            <Link href="/onboarding" className="btn-primary inline-block">Return to profile</Link>
          </div>
        ) : (
          <RecommendationsList items={recs} />
        )}
      </div>
    </div>
  )
}
