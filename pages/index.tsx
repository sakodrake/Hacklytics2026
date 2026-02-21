import Link from 'next/link'
import Head from 'next/head'
import { Syne } from 'next/font/google'

const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' })

export default function Home() {
  return (
    <>
      <Head>
        <title>TrendSpinoff — TikTok trend analytics & spinoff ideas</title>
      </Head>
      <div className="landing min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6">
        {/* Animated gradient background */}
        <div className="landing-bg absolute inset-0 -z-10" aria-hidden />

        {/* Center block: logo + CTA */}
        <div className="text-center max-w-xl mx-auto animate-fade-in">
          <h1 className={`${syne.className} text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white drop-shadow-lg`}>
            TrendSpinoff
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/90 font-medium">
            TikTok trend analytics + personalized spinoff ideas
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="landing-cta w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              Get started
            </Link>
          </div>

          <p className="mt-8 text-sm text-white/70">
            Already set up?{' '}
            <Link href="/feed" className="underline hover:text-white transition-colors">
              Go to Feed
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
