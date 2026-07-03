import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <div className="glass rounded-2xl p-8 sm:p-12 space-y-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
              <FileText className="w-7 h-7 text-cyan" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white">Terms of Service</h1>
              <p className="text-gray-400 font-body text-sm mt-1">Last updated: January 2025</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-300 font-body leading-relaxed">
            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">1. Acceptance of Terms</h2>
              <p>
                By accessing or using WatchMe, you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use the service.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">2. Description of Service</h2>
              <p>
                WatchMe provides a streaming platform for movies and TV shows, including
                user-generated comments, live chat, and watch party features. The service
                is provided on an "as is" and "as available" basis.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">3. User Responsibilities</h2>
              <ul className="space-y-2 list-disc pl-6">
                <li>You must maintain the confidentiality of your account credentials.</li>
                <li>You are responsible for all activity that occurs under your account.</li>
                <li>You agree not to misuse the service or interfere with its operation.</li>
                <li>You must not post abusive, harassing, or illegal content.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">4. Content</h2>
              <p>
                WatchMe does not claim ownership of user-generated content. By posting comments
                or chat messages, you grant WatchMe a license to display that content within
                the platform. All video content is subject to applicable licensing agreements.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">5. Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms
                or engage in prohibited conduct. Users may terminate their account at any time
                by contacting support.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
