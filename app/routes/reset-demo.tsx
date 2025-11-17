import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/reset-demo')({
  component: ResetDemoPage,
})

function ResetDemoPage() {
  const resetDemoPassword = useAction(api.auth.resetDemoPassword)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    setLoading(true)
    setMessage('')

    try {
      const result = await resetDemoPassword({})
      setMessage(`✅ ${result.message}`)
    } catch (err) {
      setMessage(`❌ Error: ${err instanceof Error ? err.message : 'Failed to reset'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Reset Demo Password
        </h1>
        <p className="text-gray-600 mb-6">
          This will reset the password for <strong>parent@example.com</strong> to <strong>demo123</strong>
        </p>

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Resetting...' : 'Reset Demo Password'}
        </button>

        {message && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-800">{message}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            After resetting, you can login with:
          </p>
          <div className="mt-2 bg-purple-50 p-3 rounded border border-purple-200">
            <p className="text-sm text-purple-900">
              <strong>Email:</strong> parent@example.com
            </p>
            <p className="text-sm text-purple-900">
              <strong>Password:</strong> demo123
            </p>
          </div>
        </div>

        <div className="mt-4">
          <a href="/login" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
