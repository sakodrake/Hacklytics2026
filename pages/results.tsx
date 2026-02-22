import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Syne } from 'next/font/google'

const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' })

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Failed to fetch')
  return r.json()
})

function VideoPreview({ url }: { url: string }) {
  // Attempt to embed when possible (TikTok/video/{id})
  if (!url) {
    return <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-sm text-slate-500">No video</div>
  }

  try {
    const m = url.match(/\/video\/(\d+)/);
    if (m) {
      const id = m[1];
      const embedSrc = `https://www.tiktok.com/embed/v2/${id}`;
      return (
        <div className="w-full h-40 overflow-hidden rounded">
          <iframe src={embedSrc} className="w-full h-40" frameBorder={0} allowFullScreen />
        </div>
      )
    }
  } catch {}

  // Fallback preview block
  return (
    <div className="w-full h-40 bg-slate-50 border border-slate-200 rounded p-3 flex flex-col items-start justify-center gap-2">
      <div className="text-sm text-slate-700 line-clamp-2">Preview unavailable</div>
      <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">Open on TikTok</a>
    </div>
  )
}

export default function Results() {
  const [profileId, setProfileId] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('trendspinoff_profileId')
    if (!id) {
      // keep empty — user should be sent to onboarding elsewhere
      return
    }
    setProfileId(id)
  }, [])

  const { data, error, isLoading } = useSWR(
    profileId ? `/api/recommendations?profileId=${profileId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!profileId) return <div className="p-6 text-center">No profile found — please complete onboarding.</div>
  if (error) return <div className="p-6 text-center text-red-600">Failed to load results</div>
  if (isLoading) return <div className="p-6 text-center">Loading recommendations...</div>

  const cards = data?.cards || []

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text) } catch (e) {}
  }

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <h1 className={`${syne.className} text-2xl font-bold mb-4`}>Recommendations</h1>

        {cards.length === 0 && (
          <div className="p-6 bg-slate-50 rounded border text-center text-slate-600">No recommendations available</div>
        )}

        <div className="space-y-4">
          {cards.map((c: any, idx: number) => (
            <div key={idx} className="app-card p-4 flex flex-col md:flex-row gap-4 items-stretch">
              <div className="md:w-1/3 w-full">
                <VideoPreview url={c.video_url} />
                <a href={c.video_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-600 underline">Open on TikTok</a>
              </div>

              <div className="md:w-2/3 w-full">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-sm text-slate-700 mb-2">{c.existing_hook_text || 'No existing hook'}</div>
                    <div className="font-semibold text-lg">{c.recommended_hook}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => copyText(c.recommended_hook)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Copy Hook</button>
                    <button onClick={() => copyText((c.recommended_hashtags || []).join(' '))} className="px-3 py-1 bg-gray-200 rounded text-sm">Copy Hashtags</button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(c.recommended_hashtags || []).map((h: string) => (
                    <span key={h} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">{h}</span>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="text-sm font-semibold">Personal touch</div>
                  <ul className="mt-2 list-disc list-inside text-sm text-slate-700">
                    {(c.personal_touch_tips || []).map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>

                {c.why_this_video && (
                  <div className="mt-3 text-xs text-slate-500">Why: {c.why_this_video}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
