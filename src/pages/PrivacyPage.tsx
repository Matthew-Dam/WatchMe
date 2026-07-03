import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <div className="glass rounded-2xl p-8 sm:p-12 space-y-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-cyan" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white">Privacy Policy</h1>
              <p className="text-gray-400 font-body text-sm mt-1">Last updated: January 2025</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-300 font-body leading-relaxed">
            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">1. Information We Collect</h2>
              <ul className="space-y-2 list-disc pl-6">
                <li>Account information (email, username, profile details).</li>
                <li>Watch history and viewing preferences.</li>
                <li>Comments, chat messages, and other user-generated content.</li>
                <li>Device and browser information for service optimization.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">2. How We Use Your Information</h2>
              <ul className="space-y-2 list-disc pl-6">
                <li>To provide and improve the streaming service.</li>
                <li>To personalize content recommendations.</li>
                <li>To enable social features like comments and watch parties.</li>
                <li>To communicate service updates and changes.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">3. Data Protection</h2>
              <p>
                We implement industry-standard security measures to protect your data.
                Passwords are hashed and stored securely. We do not sell your personal
                information to third parties.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">4. Cookies</h2>
              <p>
                We use essential cookies for authentication and session management.
                Analytics cookies help us understand usage patterns to improve the service.
                You can control cookie preferences through your browser settings.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white">5. Contact</h2>
              <p>
                For privacy-related inquiries, please contact our support team.
                We will respond to your request within a reasonable timeframe.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
