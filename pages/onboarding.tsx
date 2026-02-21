import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Onboarding() {
  const router = useRouter();
  const [primaryNiche, setPrimaryNiche] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [avoidKeywords, setAvoidKeywords] = useState<string[]>([]); // Add this
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentAvoidKeyword, setCurrentAvoidKeyword] = useState(''); // Add this
  const [noFace, setNoFace] = useState(false);
  const [effortLevel, setEffortLevel] = useState('med');
  const [region, setRegion] = useState('US');
  const [videoLength, setVideoLength] = useState(30); // Add this
  const [loading, setLoading] = useState(false);

  const addKeyword = () => {
    if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
      setKeywords([...keywords, currentKeyword.trim()]);
      setCurrentKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  // Add these new functions
  const addAvoidKeyword = () => {
    if (currentAvoidKeyword.trim() && !avoidKeywords.includes(currentAvoidKeyword.trim())) {
      setAvoidKeywords([...avoidKeywords, currentAvoidKeyword.trim()]);
      setCurrentAvoidKeyword('');
    }
  };

  const removeAvoidKeyword = (keyword: string) => {
    setAvoidKeywords(avoidKeywords.filter(k => k !== keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryNiche,
          nicheKeywords: keywords,
          avoidKeywords: avoidKeywords, // Add this
          noFace,
          effortLevel,
          region,
          videoLength
        })
      });

      if (response.ok) {
        const profile = await response.json();
        router.push(`/trend/feed?profileId=${profile.id}`);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Onboarding — TrendSpinoff</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Tell us about your content interests</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white mb-2">Primary Niche</label>
              <input 
                type="text" 
                value={primaryNiche}
                onChange={(e) => setPrimaryNiche(e.target.value)}
                placeholder="e.g., tech, cooking, gaming"
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Keywords (what you want to create about)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentKeyword}
                  onChange={(e) => setCurrentKeyword(e.target.value)}
                  placeholder="e.g., python tutorial, vegan recipes"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <button 
                  type="button" 
                  onClick={addKeyword}
                  className="px-6 py-3 bg-white text-purple-900 rounded-xl font-semibold hover:bg-white/90 transition"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {keywords.map(keyword => (
                  <span key={keyword} className="bg-white/20 text-white px-3 py-1 rounded-full flex items-center gap-2">
                    {keyword}
                    <button type="button" onClick={() => removeKeyword(keyword)} className="text-white/70 hover:text-white">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Add avoid keywords section */}
            <div>
              <label className="block text-white mb-2">Avoid Keywords (topics you want to avoid)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentAvoidKeyword}
                  onChange={(e) => setCurrentAvoidKeyword(e.target.value)}
                  placeholder="e.g., politics, drama"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAvoidKeyword())}
                />
                <button 
                  type="button" 
                  onClick={addAvoidKeyword}
                  className="px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition border border-white/30"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {avoidKeywords.map(keyword => (
                  <span key={keyword} className="bg-red-500/30 text-white px-3 py-1 rounded-full flex items-center gap-2">
                    {keyword}
                    <button type="button" onClick={() => removeAvoidKeyword(keyword)} className="text-white/70 hover:text-white">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="noFace" 
                checked={noFace} 
                onChange={(e) => setNoFace(e.target.checked)}
                className="w-5 h-5"
              />
              <label htmlFor="noFace" className="text-white">Prefer videos without face/faceless content</label>
            </div>

            <div>
              <label className="block text-white mb-2">Preferred Video Length (seconds)</label>
              <input
                type="number"
                value={videoLength}
                onChange={(e) => setVideoLength(parseInt(e.target.value))}
                min="15"
                max="300"
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Effort Level</label>
              <select 
                value={effortLevel} 
                onChange={(e) => setEffortLevel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="low">Low - Simple, quick to make</option>
                <option value="med">Medium - Moderate editing required</option>
                <option value="high">High - Complex production</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Region</label>
              <select 
                value={region} 
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="IN">India</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-white text-purple-900 rounded-xl font-bold text-lg hover:bg-white/90 transition disabled:opacity-50"
            >
              {loading ? 'Creating profile...' : 'Continue to Feed'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}