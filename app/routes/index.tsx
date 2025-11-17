import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Shield, Eye, Bell, TrendingDown, Lock, Zap } from 'lucide-react'
import { useUserSession } from '../utils/session'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useUserSession()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Public Landing Page */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  SafeGuard Kids
                </h1>
                <p className="text-sm text-purple-100">Parent Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition shadow-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Real-time monitoring and protection for your children online
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Stay informed, take action, keep them safe.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              to="/login"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-purple-700 transition shadow-md"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold border-2 border-purple-600 hover:bg-purple-50 transition"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Eye className="w-6 h-6" />}
            title="Real-Time Monitoring"
            description="Incidents appear instantly from the Chrome extension. Never miss a critical threat."
          />

          <FeatureCard
            icon={<Bell className="w-6 h-6" />}
            title="Smart Alerts"
            description="Email and SMS notifications for high-priority threats. Configurable thresholds."
          />

          <FeatureCard
            icon={<TrendingDown className="w-6 h-6" />}
            title="Advanced Analytics"
            description="Track patterns, identify trends, and understand your child's online interactions."
          />

          <FeatureCard
            icon={<Lock className="w-6 h-6" />}
            title="100% Private"
            description="All AI processing happens locally. Your data never leaves your control."
          />

          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Multi-Device Access"
            description="Monitor from anywhere. Phone, tablet, or desktop - always connected."
          />

          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Law Enforcement Ready"
            description="Export detailed reports with full evidence for authorities."
          />
        </div>

        {/* Tech Stack Badge */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4">Built with</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <TechBadge name="TanStack Start" />
            <TechBadge name="Convex" />
            <TechBadge name="React" />
            <TechBadge name="TypeScript" />
            <TechBadge name="Netlify" />
            <TechBadge name="Sentry" />
          </div>
        </div>

        {/* Chrome Extension Info */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            How It Works
          </h3>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </span>
              <div className="text-gray-700">
                <strong className="text-gray-900">Install Chrome Extension</strong> on your child's browser to monitor social media conversations in real-time.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </span>
              <div className="text-gray-700">
                <strong className="text-gray-900">Extension Detects Threats</strong> using AI-powered analysis (grooming, sexual content, personal info requests).
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </span>
              <div className="text-gray-700">
                <strong className="text-gray-900">Incidents Sync to Dashboard</strong> via Convex backend for real-time updates across all your devices.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                4
              </span>
              <div className="text-gray-700">
                <strong className="text-gray-900">You Take Action</strong> with case-specific guidance, notifications, and export tools for authorities.
              </div>
            </li>
          </ol>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600 text-sm pb-8">
          <p>
            Built with care to protect children online
          </p>
          <p className="mt-2">
            TanStack Start Hackathon 2025 | Open Source | MIT License
          </p>
        </footer>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-200 transition group">
      <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-100 transition">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}

function TechBadge({ name }: { name: string }) {
  return (
    <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200">
      {name}
    </span>
  )
}
