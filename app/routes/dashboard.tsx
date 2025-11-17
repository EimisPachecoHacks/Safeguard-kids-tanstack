import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Shield, AlertTriangle, Bell, TrendingUp, Eye, Users, ChevronDown } from 'lucide-react'
import { IncidentCard } from '../components/IncidentCard'
import { ThreatChart } from '../components/ThreatChart'
import { StatCard } from '../components/StatCard'
import { useEffect, useState } from 'react'
import { useUserSession } from '../utils/session'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()
  const { user: sessionUser, isAuthenticated } = useUserSession()
  const [isInitializing, setIsInitializing] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const initialize = useMutation(api.seed.initialize)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, navigate])

  // Get full user data from Convex
  const user = useQuery(
    api.auth.getCurrentUser,
    sessionUser ? { userId: sessionUser.userId } : 'skip'
  )

  // Auto-initialize database if no user exists
  useEffect(() => {
    if (user === null && !isInitializing) {
      setIsInitializing(true)
      initialize({})
        .then(() => {
          console.log('Database initialized with seed data')
          setIsInitializing(false)
        })
        .catch((err) => {
          console.error('Failed to initialize database:', err)
          setIsInitializing(false)
        })
    }
  }, [user, isInitializing, initialize])

  // Get children for dropdown
  const children = useQuery(
    api.children.getAll,
    user ? { userId: user._id } : "skip"
  )

  // Set default selected child when children load
  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0]._id)
    }
  }, [children, selectedChildId])

  // Real-time queries to Convex - filtered by selected child
  const incidents = useQuery(
    api.incidents.getRecent,
    selectedChildId
      ? { limit: 20, childId: selectedChildId as any }
      : user
        ? { limit: 20, userId: user._id }
        : "skip"
  )

  // Get stats filtered by selected child
  const stats = useQuery(
    api.incidents.getStats,
    user
      ? {
          userId: user._id,
          childId: selectedChildId ? selectedChildId as any : undefined
        }
      : "skip"
  )

  // Loading state
  if (incidents === undefined || stats === undefined || user === undefined || isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">
            {isInitializing ? 'Setting up your dashboard...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    )
  }

  const selectedChild = children?.find(c => c._id === selectedChildId)

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Child Selector */}
        {children && children.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Monitoring:</label>
              <div className="relative">
                <select
                  value={selectedChildId || ''}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                >
                  {children.map((child) => (
                    <option key={child._id} value={child._id}>
                      {child.name} {child.age ? `(Age ${child.age})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              {selectedChild && (
                <span className={`text-sm ${selectedChild.monitoringEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {selectedChild.monitoringEnabled ? 'Active' : 'Paused'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            title="Total Incidents"
            value={stats.total}
            color="blue"
            subtitle={`${stats.unviewed} unviewed`}
          />

          <StatCard
            icon={<Shield className="w-6 h-6" />}
            title="Critical Threats"
            value={stats.critical}
            color="red"
            subtitle="Require immediate action"
          />

          <StatCard
            icon={<Eye className="w-6 h-6" />}
            title="High Priority"
            value={stats.high}
            color="orange"
            subtitle="Needs attention"
          />

          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Trend"
            value={stats.recentTrend}
            color={stats.recentTrend === 'increasing' ? 'red' : 'green'}
            subtitle="Last 7 days"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Threats by Platform
            </h3>
            <ThreatChart data={stats.platforms} type="platform" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Threats by Category
            </h3>
            <ThreatChart data={stats.categories} type="category" />
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Incidents
              </h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition">
                  All
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
                  Critical
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
                  High
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
                  Unviewed
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {incidents.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No incidents detected
                </h3>
                <p className="text-gray-600">
                  Your children are browsing safely. We'll alert you if any threats are detected.
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Make sure the SafeGuard Kids Chrome extension is installed and active on your child's browser.
                </p>
              </div>
            ) : (
              incidents.map((incident) => (
                <IncidentCard key={incident._id} incident={incident} />
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/children"
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-200 transition text-left group"
          >
            <Users className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition">
              Manage Children
            </h3>
            <p className="text-sm text-gray-600">
              Add or edit child profiles and monitoring settings
            </p>
          </Link>

          <Link
            to="/notifications"
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-200 transition text-left group"
          >
            <Bell className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition">
              Notification Settings
            </h3>
            <p className="text-sm text-gray-600">
              Configure email and SMS alerts for threats
            </p>
          </Link>

          <Link
            to="/reports"
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-200 transition text-left group"
          >
            <Shield className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition">
              Export Reports
            </h3>
            <p className="text-sm text-gray-600">
              Generate reports for law enforcement or records
            </p>
          </Link>
        </div>
      </main>
    </div>
  )
}
