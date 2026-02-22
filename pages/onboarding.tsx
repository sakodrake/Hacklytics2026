
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Syne } from 'next/font/google'
import { PreferredStyleSelector } from '../components/PreferredStyleSelector'

const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' })

const NICHES = ['Tech', 'Fitness', 'Study', 'Fashion', 'Food']
const EFFORT_LEVELS = ['low', 'med', 'high']
const STYLES = ['Educational', 'Entertaining', 'Storytelling', 'Memes', 'Cinematic', 'Faceless']

export default function Onboarding() {
  const [primaryNiche, setPrimaryNiche] = useState('Tech')
  const [customPrimary, setCustomPrimary] = useState('')
  const [interests, setInterests] = useState<string[]>(['Tech'])
  const [newInterest, setNewInterest] = useState('')
  const [goals, setGoals] = useState<string[]>(['engagement'])
  const [style, setStyle] = useState(STYLES[0])
  const [effortLevel, setEffortLevel] = useState('med')
  const [videoLength, setVideoLength] = useState('30')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()


  function toggleInterest(n: string) {
    setInterests(prev => (prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]))
  }

  function addInterest() {
    const v = newInterest.trim()
    if (!v) return
    if (!interests.includes(v)) {
      setInterests(prev => [...prev, v])
    }
    setNewInterest('')
  }

  function onInterestKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addInterest()
    }
  }

  async function save() {
    setLoading(true)
    setError('')
    try {
      const primaryToSave = primaryNiche === 'Other' ? (customPrimary.trim() || '') : primaryNiche
      const payload = {
        primaryNiche: primaryToSave,
        interests,
        goals,
        style: [style],
        effortLevel,
        videoLength: Number(videoLength)
      }

      // POST to recommendations API, store results in sessionStorage, then navigate
      const recRes = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!recRes.ok) {
        const ct = recRes.headers.get('content-type') || ''
        let errText = ''
        try {
          if (ct.includes('application/json')) {
            const data = await recRes.json()
            errText = data?.message || JSON.stringify(data)
          } else {
            errText = await recRes.text()
          }
        } catch (e) {
          errText = `HTTP ${recRes.status} ${recRes.statusText}`
        }
        throw new Error(errText || 'Failed to fetch recommendations')
      }

      // parse response as JSON, but guard against non-JSON bodies
      let recData: any = null
      try {
        recData = await recRes.json()
      } catch (e) {
        const text = await recRes.text()
        throw new Error(`Invalid JSON response from /api/recommendations: ${text}`)
      }
      sessionStorage.setItem('trendspinoff_recs', JSON.stringify(recData))
      // also persist lightweight profile for future use
      localStorage.setItem('trendspinoff_profile', JSON.stringify({
        primaryNiche: primaryToSave,
        interests,
        goals,
        effortLevel,
        preferredLengthSeconds: Number(videoLength)
      }))

      router.push('/analysis')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving profile')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="app-bg absolute inset-0 -z-10" aria-hidden />
      {/* Accent Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.25)_0%,transparent_60%)] blur-2xl opacity-60 z-0" />
      <div className="relative min-h-screen p-6 flex flex-col items-center">
        <section className="relative mx-auto w-full max-w-2xl px-4 z-10 animate-fade-in">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-xl">
            <div className="p-6 sm:p-10 space-y-6">
              <Link href="/" className="inline-flex items-center text-white/80 hover:text-white text-sm mb-8 transition-colors">
                ← Back
              </Link>
              <div className="text-center mb-8">
                <h1 className={`${syne.className} page-title text-4xl sm:text-5xl mb-2`}>
                  Viralytics Setup
                </h1>
                <p className="page-subtitle text-lg text-white">
                  Tell us your preferences so we can find trends that work for you
                </p>
                <hr className="my-6 border-t border-white/30" />
              </div>
              {error && (
                <div className="app-card p-4 mb-6 border-l-4 border-red-500 text-red-800 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="label block mb-3 text-white text-lg font-semibold tracking-wide drop-shadow-sm" style={{fontFamily: 'Inter, Arial, sans-serif'}}>Primary Niche</label>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map(n => (
                    <button
                      key={n}
                      onClick={() => { setPrimaryNiche(n); setCustomPrimary('') }}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition duration-200 border border-white/30
                        ${primaryNiche === n
                          ? 'bg-white text-slate-900 shadow-xl ring-2 ring-white/80 border-white'
                          : 'bg-slate-800 text-white hover:bg-slate-700'}
                        focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPrimaryNiche('Other')}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition duration-200 border border-white/30
                        ${primaryNiche === 'Other'
                          ? 'bg-white text-slate-900 shadow-xl ring-2 ring-white/80 border-white'
                          : 'bg-slate-800 text-white hover:bg-slate-700'}
                        focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2`}
                  >
                    Other
                  </button>
                </div>
                {primaryNiche === 'Other' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={customPrimary}
                      onChange={e => setCustomPrimary(e.target.value)}
                      placeholder="Enter your niche (e.g. 'SaaS', 'Parenting')"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="label block mb-3 text-white text-lg font-semibold tracking-wide drop-shadow-sm" style={{fontFamily: 'Inter, Arial, sans-serif'}}>Interests (select all that apply)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {NICHES.map(n => (
                    <button
                      key={n}
                      onClick={() => toggleInterest(n)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition duration-200 border border-white/30
                        ${interests.includes(n)
                          ? 'bg-white text-slate-900 shadow-xl ring-2 ring-white/80 border-white'
                          : 'bg-slate-800 text-white hover:bg-slate-700'}
                        focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2`}
                    >
                      {n}
                    </button>
                  ))}
                  {interests.filter(i => !NICHES.includes(i)).map(ci => (
                    <button
                      key={ci}
                      onClick={() => toggleInterest(ci)}
                      className="px-3 py-2 rounded-xl text-sm font-medium transition duration-200 border border-white/30 bg-white text-slate-900 shadow-xl ring-2 ring-white/80 border-white focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2"
                    >
                      {ci}
                    </button>
                  ))}

                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={e => setNewInterest(e.target.value)}
                    onKeyDown={onInterestKey}
                    placeholder="Anything else you're interested in?"
                    className={`flex-1 p-3 bg-black/40 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-white backdrop-blur-sm ${!newInterest ? 'placeholder-white/70 focus:placeholder-white/10' : 'placeholder-transparent'}`}
                    style={{fontFamily: 'Inter, Arial, sans-serif'}}
                  />
                  <button
                    onClick={addInterest}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white"
                      style={{fontFamily: 'Inter, Arial, sans-serif'}}
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="label block mb-3 text-white text-lg font-semibold tracking-wide drop-shadow-sm" style={{fontFamily: 'Inter, Arial, sans-serif'}}>Preferred Style</label>
                <div style={{fontFamily: 'Inter, Arial, sans-serif'}} className="flex items-center">
                  <PreferredStyleSelector
                    options={STYLES}
                    value={style}
                    onChange={setStyle}
                  />
                </div>
              </div>
              <div>
                <label className="label block mb-3 text-white text-lg font-semibold tracking-wide drop-shadow-sm" style={{fontFamily: 'Inter, Arial, sans-serif'}}>Effort Level</label>
                <select
                  value={effortLevel}
                  onChange={e => setEffortLevel(e.target.value)}
                  className="w-full h-[40px] px-3 py-2 bg-slate-800 text-white border border-white/30 rounded-xl text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2"
                >
                  <option value="low">Low (quick clips, minimal editing)</option>
                  <option value="med">Medium (some editing, planning)</option>
                  <option value="high">High (production-level content)</option>
                </select>
              </div>
              <div>
                <label className="label block mb-3 text-white text-lg font-semibold tracking-wide drop-shadow-sm" style={{fontFamily: 'Inter, Arial, sans-serif'}}>
                  Preferred Video Length (seconds)
                </label>
                <input
                  type="number"
                  value={videoLength}
                  onChange={e => setVideoLength(e.target.value)}
                  className="w-full h-[40px] px-3 py-2 bg-slate-800 text-white border border-white/30 rounded-xl text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2"
                />
              </div>
              <button
                onClick={save}
                disabled={loading}
                style={{fontFamily: 'Montserrat, Inter, Arial, sans-serif'}}
                className="mt-8 mx-auto w-[320px] max-w-full flex items-center justify-center px-8 py-5 text-2xl font-extrabold tracking-wide rounded-2xl transition-all duration-200 ease-out opacity-95 hover:opacity-100 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 bg-blue-500 text-white shadow-xl border border-white/40"
              >
                {loading ? 'Saving...' : 'Let’s Viralyze.'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
