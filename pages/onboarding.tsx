import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Syne } from 'next/font/google'

const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' })

const NICHES = ['Tech', 'Fitness', 'Study', 'Fashion', 'Food']
const EFFORT_LEVELS = ['low', 'med', 'high']
const STYLES = ['Educational', 'Storytelling', 'Memes', 'Cinematic', 'Talking-head']


export default function Onboarding() {
  const [primaryNiche, setPrimaryNiche] = useState('Tech')
  const [customPrimary, setCustomPrimary] = useState('')
  const [interests, setInterests] = useState<string[]>(['Tech'])
  const [newInterest, setNewInterest] = useState('')
  const [goals, setGoals] = useState<string[]>(['engagement'])
  const [style, setStyle] = useState(STYLES[0])
  const [noFace, setNoFace] = useState(true)
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
        noFace,
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
        noFace,
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
      <div className="relative min-h-screen p-6 flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center text-white/80 hover:text-white text-sm mb-8 transition-colors">
            ← Back
          </Link>

          <div className="text-center mb-8 animate-fade-in">
            <h1 className={`${syne.className} page-title text-4xl sm:text-5xl mb-2`}>
              TrendSpinoff Setup
            </h1>
            <p className="page-subtitle text-lg">
              Tell us your preferences so we can find trends that work for you
            </p>
          </div>

          {error && (
            <div className="app-card p-4 mb-6 border-l-4 border-red-500 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="app-card p-6 sm:p-8 space-y-6 animate-fade-in">
            <div>
              <label className="label block mb-3">Primary Niche</label>
              <div className="flex flex-wrap gap-2">
                {NICHES.map(n => (
                  <button
                    key={n}
                    onClick={() => { setPrimaryNiche(n); setCustomPrimary('') }}
                    className={`px-4 py-2 rounded-xl font-medium transition ${
                      primaryNiche === n
                        ? 'bg-slate-800 text-white shadow'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  onClick={() => setPrimaryNiche('Other')}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    primaryNiche === 'Other'
                      ? 'bg-slate-800 text-white shadow'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
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
              <label className="label block mb-3">Interests (select all that apply)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {NICHES.map(n => (
                  <button
                    key={n}
                    onClick={() => toggleInterest(n)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      interests.includes(n)
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}

                {interests.filter(i => !NICHES.includes(i)).map(ci => (
                  <button
                    key={ci}
                    onClick={() => toggleInterest(ci)}
                    className="px-3 py-2 rounded-xl text-sm font-medium transition bg-slate-700 text-white"
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
                  placeholder="Add another interest and press Enter"
                  className="flex-1 p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
                />
                <button
                  onClick={addInterest}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="label block mb-3">Preferred Style</label>
              <select
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
              >
                {STYLES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="noFace"
                checked={noFace}
                onChange={e => setNoFace(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
              />
              <label htmlFor="noFace" className="label">
                Prefer videos without showing my face
              </label>
            </div>

            <div>
              <label className="label block mb-3">Effort Level</label>
              <select
                value={effortLevel}
                onChange={e => setEffortLevel(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
              >
                <option value="low">Low (quick clips, minimal editing)</option>
                <option value="med">Medium (some editing, planning)</option>
                <option value="high">High (production-level content)</option>
              </select>
            </div>

            <div>
              <label className="label block mb-3">
                Preferred Video Length (seconds)
              </label>
              <input
                type="number"
                value={videoLength}
                onChange={e => setVideoLength(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              />
            </div>

            <button
              onClick={save}
              disabled={loading}
              className="btn-primary w-full px-6 py-4 text-lg"
            >
              {loading ? 'Saving...' : 'Save & Start Finding Trends'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
