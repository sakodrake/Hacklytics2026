import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Syne } from 'next/font/google'

const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' })

const NICHES = ['Tech', 'Fitness', 'Study', 'Fashion', 'Food']
const EFFORT_LEVELS = ['low', 'med', 'high']
const STYLES = ['educational', 'storytelling', 'memes', 'cinematic', 'talking-head']

export default function Onboarding() {
  const [primaryNiche, setPrimaryNiche] = useState('Tech')
  const [interests, setInterests] = useState<string[]>(['Tech'])
  const [goals, setGoals] = useState<string[]>(['engagement'])
  const [style, setStyle] = useState('educational')
  const [noFace, setNoFace] = useState(true)
  const [effortLevel, setEffortLevel] = useState('med')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function toggleInterest(n: string) {
    setInterests(prev => (prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]))
  }

  async function save() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryNiche,
          interests,
          goals,
          style: [style],
          noFace,
          effortLevel
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to save profile')
      }

      const { profileId } = await response.json()
      localStorage.setItem('trendspinoff_profileId', profileId)
      localStorage.setItem('trendspinoff_profile', JSON.stringify({
        primaryNiche,
        interests,
        goals,
        noFace,
        effortLevel
      }))
      router.push('/feed')
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
                    onClick={() => setPrimaryNiche(n)}
                    className={`px-4 py-2 rounded-xl font-medium transition ${
                      primaryNiche === n
                        ? 'bg-slate-800 text-white shadow'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label block mb-3">Interests (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
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
