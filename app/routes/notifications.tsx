import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Shield, Bell, Mail, MessageSquare, ArrowLeft, Save, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useUserSession } from '../utils/session'

export const Route = createFileRoute('/notifications')({
  component: NotificationSettings,
})

function NotificationSettings() {
  const navigate = useNavigate()
  const { user: sessionUser, isAuthenticated } = useUserSession()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [emailThreshold, setEmailThreshold] = useState(5)
  const [smsThreshold, setSmsThreshold] = useState(7)
  const [dailyDigest, setDailyDigest] = useState(true)
  const [phone, setPhone] = useState('')

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

  const updateSettings = useMutation(api.users.updateNotificationSettings)

  // Load user settings when available
  useEffect(() => {
    if (user) {
      setEmailEnabled(user.notificationSettings.emailEnabled)
      setSmsEnabled(user.notificationSettings.smsEnabled)
      setEmailThreshold(user.notificationSettings.emailThreshold)
      setSmsThreshold(user.notificationSettings.smsThreshold)
      setDailyDigest(user.notificationSettings.dailyDigest)
      setPhone(user.phone || '')
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      await updateSettings({
        userId: user._id,
        settings: {
          emailEnabled,
          smsEnabled,
          emailThreshold,
          smsThreshold,
          dailyDigest,
        },
        phone: smsEnabled ? phone : undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Notification Settings
                </h1>
                <p className="text-sm text-gray-600">
                  Configure how you receive threat alerts
                </p>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Email Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
                <p className="text-sm text-gray-600">Receive alerts at {user.email}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {emailEnabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Threshold
                </label>
                <select
                  value={emailThreshold}
                  onChange={(e) => setEmailThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={3}>Low and above (All alerts)</option>
                  <option value={5}>Medium and above</option>
                  <option value={7}>High and above</option>
                  <option value={9}>Critical only</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Only send emails for threats at this level or higher
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Daily Digest</p>
                  <p className="text-sm text-gray-600">
                    Receive a daily summary of all activity
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dailyDigest}
                    onChange={(e) => setDailyDigest(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* SMS Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">SMS Notifications</h2>
                <p className="text-sm text-gray-600">Get text alerts for urgent threats</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {smsEnabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMS Alert Threshold
                </label>
                <select
                  value={smsThreshold}
                  onChange={(e) => setSmsThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={5}>Medium and above</option>
                  <option value={7}>High and above</option>
                  <option value={9}>Critical only</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  SMS is recommended for high-priority alerts only
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Test Notification */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Notifications</h2>
          <p className="text-sm text-gray-600 mb-4">
            Send a test notification to verify your settings are working correctly.
          </p>
          <div className="flex gap-3">
            <button
              disabled={!emailEnabled}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Test Email
            </button>
            <button
              disabled={!smsEnabled || !phone}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Test SMS
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
