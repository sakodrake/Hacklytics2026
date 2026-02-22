"use client"
import React from 'react'
import type { Recommendation } from '../src/types/recommendation'

export default function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4 flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/3 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
        <a href={rec.videoUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
          <div className="w-full h-40 md:h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="text-sm text-slate-600">Open video</span>
          </div>
        </a>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{rec.topic}</h3>
            <div className="text-xs text-slate-500">{rec.metrics.views.toLocaleString()} views</div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {rec.hashtags.map(h => (
              <span key={h} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">{h}</span>
            ))}
          </div>

          <div className="border bg-gray-50 rounded-xl p-3 mb-3 text-sm text-slate-800">
            {rec.hook}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">How to make it yours</h4>
            <ul className="list-disc list-inside text-sm text-slate-700">
              {rec.personalTouch.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <div className="space-x-3">
            <span>Eng: {(rec.metrics.engagementRate * 100).toFixed(2)}%</span>
            <span>Len: {rec.metrics.lengthSec}s</span>
          </div>
          <div className="text-right text-xs">
            <div className="font-medium">{rec.metrics.style}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
