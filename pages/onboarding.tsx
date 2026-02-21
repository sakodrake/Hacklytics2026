import { useState } from 'react'
import { useRouter } from 'next/router'

const NICHES = ['Tech', 'Fitness', 'Study', 'Fashion', 'Food']
const EFFORT_LEVELS = ['low', 'med', 'high']
const STYLES = ['educational', 'storytelling', 'memes', 'cinematic', 'talking-head']

export default function Onboarding(){
  const [primaryNiche, setPrimaryNiche] = useState('Tech')
  const [interests, setInterests] = useState<string[]>(['Tech'])
  const [goals, setGoals] = useState<string[]>(['engagement'])
  const [style, setStyle] = useState('educational')
  const [noFace, setNoFace] = useState(true)
  const [effortLevel, setEffortLevel] = useState('med')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function toggleInterest(n: string){
    setInterests(prev => prev.includes(n) ? prev.filter(x=>x!==n) : [...prev,n])
  }

  async function save(){
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
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">TrendSpinoff Setup</h1>
        <p className="text-slate-600 mb-8">Tell us your preferences so we can find trends that work for you</p>

        {error && <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Primary Niche */}
          <div>
            <label className="block mb-3 font-semibold text-slate-700">Primary Niche</label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => (
                <button 
                  key={n} 
                  onClick={() => setPrimaryNiche(n)}
                  className={`px-4 py-2 rounded font-medium transition ${primaryNiche === n ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block mb-3 font-semibold text-slate-700">Interests (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => (
                <button 
                  key={n}
                  onClick={() => toggleInterest(n)}
                  className={`px-3 py-2 rounded text-sm transition ${interests.includes(n) ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Content Style */}
          <div>
            <label className="block mb-3 font-semibold text-slate-700">Preferred Style</label>
            <select 
              value={style} 
              onChange={e => setStyle(e.target.value)} 
              className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* No-Face Option */}
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="noFace"
              checked={noFace}
              onChange={e => setNoFace(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="noFace" className="font-medium text-slate-700">Prefer videos without showing my face</label>
          </div>

          {/* Effort Level */}
          <div>
            <label className="block mb-3 font-semibold text-slate-700">Effort Level</label>
            <select 
              value={effortLevel} 
              onChange={e => setEffortLevel(e.target.value)} 
              className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low (quick clips, minimal editing)</option>
              <option value="med">Medium (some editing, planning)</option>
              <option value="high">High (production-level content)</option>
            </select>
          </div>

          {/* Save Button */}
          <button 
            onClick={save} 
            disabled={loading}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition"
          >
            {loading ? 'Saving...' : 'Save & Start Finding Trends'}
          </button>
        </div>
      </div>
    </div>
  )
}
