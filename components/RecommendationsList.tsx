"use client"
import React from 'react'
import RecommendationCard from './RecommendationCard'
import type { Recommendation } from '../src/types/recommendation'

export default function RecommendationsList({ items }: { items: Recommendation[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-600">
        No recommendations found. Try updating your profile.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((r, i) => (
        <RecommendationCard key={r.videoUrl + i} rec={r} />
      ))}
    </div>
  )
}
