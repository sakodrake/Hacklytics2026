import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Feed() {
  const router = useRouter();
  const { profileId } = router.query;
  
  const [trends, setTrends] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (profileId) {
      fetchProfile();
      fetchTrends();
    }
  }, [profileId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile?profileId=${profileId}`);
      const data = await res.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchTrends = async () => {
    try {
      const res = await fetch(`/api/youtube-trends?profileId=${profileId}`);
      const data = await res.json();
      setTrends(data.videos || []);
      setPatterns(data.patterns);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-white text-xl">Finding trends for you...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Your Feed — TrendSpinoff</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-purple-900">TrendSpinoff</h1>
            <div className="flex gap-4">
              <Link href={`/trend/insights?profileId=${profileId}`} className="text-purple-600 hover:text-purple-800">
                Insights
              </Link>
              <Link href={`/onboarding?edit=${profileId}`} className="text-purple-600 hover:text-purple-800">
                Edit Profile
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Trends for {profile?.primaryNiche || 'your niche'}
            </h2>
            <p className="text-gray-600 mt-2">
              Based on: {profile?.nicheKeywords?.join(', ')}
            </p>
          </div>

          {/* Format suggestions */}
          {patterns && (
            <div className="mb-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 Video Format Suggestions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {patterns.hooks?.map((hook: string, i: number) => (
                  <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-gray-800">{hook}</p>
                  </div>
                ))}
                {patterns.structures?.map((structure: string, i: number) => (
                  <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-gray-800">{structure}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending videos */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Trending in Your Niche</h3>
            {trends.length === 0 ? (
              <p className="text-gray-500">No trending videos found for your interests. Try adding more keywords.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trends.map(video => (
                  <a 
                    key={video.videoId}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition"
                  >
                    <img 
                      src={video.thumbnails?.medium?.url} 
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 line-clamp-2">{video.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{video.channelTitle}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-purple-600">
                          {Math.round(video.relevanceScore * 100)}% match
                        </span>
                        <span className="text-sm text-gray-500">
                          {video.viewCount?.toLocaleString()} views
                        </span>
                      </div>
                      {video.matchedTerms?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {video.matchedTerms.slice(0, 3).map((term: string) => (
                            <span key={term} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}