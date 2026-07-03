import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Film } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <div className="glass rounded-2xl p-8 sm:p-12 space-y-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
              <Film className="w-7 h-7 text-cyan" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white">About WatchMe</h1>
              <p className="text-gray-400 font-body text-sm mt-1">The next-generation streaming platform</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-300 font-body leading-relaxed">
            <p>
              WatchMe is a modern streaming platform built for discovering and watching movies and TV shows.
              Our platform combines a vast catalog of content with social features that let you
              connect with other viewers in real time.
            </p>

            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">Features</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan mt-2 shrink-0" />
                  <span><strong className="text-white">Adaptive Streaming</strong> &mdash; Multi-bitrate HLS playback that adapts to your connection speed for buffer-free viewing.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-magenta mt-2 shrink-0" />
                  <span><strong className="text-white">Timestamped Comments</strong> &mdash; Join the discussion at any point in a video with spoiler-shielded, timestamp-linked comments.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime mt-2 shrink-0" />
                  <span><strong className="text-white">Watch Parties</strong> &mdash; Watch together in perfect sync with friends using real-time playback synchronization.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan mt-2 shrink-0" />
                  <span><strong className="text-white">Multi-Profile</strong> &mdash; Each account supports multiple profiles with personalized watchlists and recommendations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-magenta mt-2 shrink-0" />
                  <span><strong className="text-white">Mood-Based Discovery</strong> &mdash; Find content by vibe and mood, not just genre.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">Technology</h2>
              <p>
                Built with a modern stack &mdash; FastAPI on the backend, React with Vite on the frontend,
                and PostgreSQL for reliable data storage. Video is transcoded to HLS with adaptive
                bitrate streaming for the best possible viewing experience.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
