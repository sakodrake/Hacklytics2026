import { useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { Syne } from 'next/font/google'

const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' })

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Analysis() {
    // Helper to extract TikTok video ID from URL
    function getTikTokId(url: string): string | undefined {
      // Handles URLs like https://www.tiktok.com/@user/video/1234567890
      const match = url.match(/video\/(\d+)/)
      return match ? match[1] : undefined
    }
  const [recs, setRecs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('trendspinoff_recs')
      if (raw) {
        const parsed = JSON.parse(raw)
        setRecs(parsed.recommendations || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  return (
    <>
      <Head>
        <title>Viralytics — Your Trend Spinoff Suggestions</title>
      </Head>
      <div className="min-h-screen relative overflow-hidden">
        <div className="app-bg absolute inset-0 -z-10" aria-hidden />
        {/* Accent Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.25)_0%,transparent_60%)] blur-2xl opacity-60 z-0" />
        <div className="relative min-h-screen p-6 flex flex-col items-center">
          <section className="relative mx-auto w-full max-w-4xl px-4 z-10 animate-fade-in">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-xl">
              <div className="p-6 sm:p-10 space-y-6">
                <h1 className={classNames(syne.className, "text-4xl sm:text-5xl font-bold text-white text-center drop-shadow-lg mb-6")}>Your Personalized Trend Spinoffs</h1>
                <p className="text-center text-lg text-white/80 mb-10 max-w-2xl mx-auto">Based on your profile, here are spinoff video ideas and trends you can make your own. Click a card to view the original video for inspiration!</p>

                {loading ? (
                  <div className="text-center text-white/80 py-12 text-lg">Loading recommendations…</div>
                ) : recs.length === 0 ? (
                  <div className="app-card p-8 text-center bg-white/10 border border-white/20 rounded-2xl text-white/80">
                    <p className="mb-3">No recommendations found. Try updating your profile.</p>
                    <Link href="/onboarding" className="btn-primary inline-block">Return to profile</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {recs.map((rec, i) => (
                      <a
                        key={rec.videoUrl + i}
                        href={rec.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-2xl bg-white/90 hover:bg-white shadow-xl border border-white/60 hover:border-blue-400 transition-all duration-200 p-6 flex flex-col gap-3 cursor-pointer hover:-translate-y-1 hover:shadow-2xl"
                      >
                        {/* Video Preview */}
                        {rec.videoUrl && rec.videoUrl.includes('tiktok.com') ? ( 
                          <div className="w-full aspect-[9/16] rounded-xl overflow-hidden mb-2 border border-blue-100 bg-black flex items-center justify-center">
                            <iframe
                              src={`https://www.tiktok.com/embed/v2/${getTikTokId(rec.videoUrl)}`}
                              title="TikTok video preview"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                              className="w-full h-full min-h-[200px]"
                              loading="lazy"
                            />
                          </div>
                        ) : rec.videoUrl ? (
                          <div className="w-full aspect-[9/16] rounded-xl overflow-hidden mb-2 border border-blue-100 bg-black flex items-center justify-center">
                            <span className="text-xs text-white/70">No preview available</span>
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">{rec.topic || rec.title}</h2>
                          <span className="text-xs text-slate-500">{rec.metrics?.views?.toLocaleString()} views</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {rec.hashtags?.map((h: string) => (
                            <span key={h} className="rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-medium">{h}</span>
                          ))}
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-slate-800 mb-2 text-sm">
                          {rec.hook}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-1 text-blue-900">How to make it yours</h4>
                          <ul className="list-disc list-inside text-sm text-slate-700">
                            {rec.personalTouch?.map((p: string, j: number) => (
                              <li key={j}>{p}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                          <div className="space-x-3">
                            <span>Eng: {(rec.metrics?.engagementRate * 100).toFixed(2)}%</span>
                            <span>Len: {rec.metrics?.lengthSec}s</span>
                          </div>
                          <div className="text-right text-xs">
                            <div className="font-medium">{rec.metrics?.style}</div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-12 text-center">
                  <Link href="/onboarding" className="inline-block text-white/80 hover:text-white underline text-sm">Edit profile</Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
