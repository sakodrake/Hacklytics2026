"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import RecommendationsList from '../../components/RecommendationsList'
import type { Recommendation } from '../../src/types/recommendation'

export default function AnalysisPage() {
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
    } catch (err) {
      setRecs([])
    }
  }, [])

  if (recs === null) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto">Loading recommendations...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Analysis & Recommendations</h1>
        {recs.length === 0 ? (
          <div className="app-card p-6 text-center">
            <p className="mb-4">No recommendations available.</p>
            <Link href="/onboarding" className="btn-primary inline-block">Return to profile</Link>
          </div>
        ) : (
          <RecommendationsList items={recs} />
        )}
      </div>
    </div>
  )
}
