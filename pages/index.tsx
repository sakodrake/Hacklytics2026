import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">TrendSpinoff — Demo</h1>
        <p className="mb-6">Personalized TikTok trend analytics + spin-off ideas (demo)</p>

        <div className="space-x-4">
          <Link href="/onboarding" className="px-4 py-2 bg-blue-600 text-white rounded">
            Onboarding
          </Link>
          <Link href="/feed" className="px-4 py-2 border rounded">
            Feed
          </Link>
          <Link href="/insights" className="px-4 py-2 border rounded">
            Insights (coming)
          </Link>
        </div>
      </div>
    </div>
  )
}
