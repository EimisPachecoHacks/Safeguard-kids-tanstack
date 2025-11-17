import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Shield, Plus, ArrowLeft, X, Edit2, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useUserSession } from '../utils/session'

export const Route = createFileRoute('/children')({
  component: ChildrenManagement,
})

function ChildrenManagement() {
  const navigate = useNavigate()
  const { user: sessionUser, isAuthenticated } = useUserSession()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingChild, setEditingChild] = useState<any>(null)

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
  const children = user ? useQuery(api.children.getAll, { userId: user._id }) : undefined

  const updateChild = useMutation(api.children.update)

  if (!user || children === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const togglePlatform = async (childId: string, currentPlatforms: string[], platform: string) => {
    const newPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform]

    await updateChild({
      childId: childId as any,
      platforms: newPlatforms,
    })
  }

  const allPlatforms = [
    { id: 'facebook', name: 'Facebook', emoji: '📘' },
    { id: 'instagram', name: 'Instagram', emoji: '📷' },
    { id: 'discord', name: 'Discord', emoji: '💬' },
    { id: 'whatsapp', name: 'WhatsApp', emoji: '💚' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Manage Children
                </h1>
                <p className="text-sm text-gray-600">
                  Add children and configure monitored platforms
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Child
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {children.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Children Added Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first child to start monitoring their online safety.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Your First Child
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {children.map((child) => (
              <div key={child._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Child Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{child.name}</h2>
                      {child.age && (
                        <p className="text-sm text-gray-600">Age {child.age}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingChild(child)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Edit child"
                  >
                    <Edit2 className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Monitored Platforms */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Monitored Platforms
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {allPlatforms.map((platform) => {
                      const isEnabled = child.platforms.includes(platform.id)
                      return (
                        <button
                          key={platform.id}
                          onClick={() => togglePlatform(child._id, child.platforms, platform.id)}
                          className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                            isEnabled
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 bg-gray-50 opacity-50'
                          }`}
                        >
                          <span className="text-2xl">{platform.emoji}</span>
                          <span className={`text-sm font-medium ${isEnabled ? 'text-purple-700' : 'text-gray-500'}`}>
                            {platform.name}
                          </span>
                          <span className={`text-xs ${isEnabled ? 'text-purple-600' : 'text-gray-400'}`}>
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Child Modal */}
      {showAddModal && user && (
        <AddChildModal
          userId={user._id}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Child Modal */}
      {editingChild && (
        <EditChildModal
          child={editingChild}
          onClose={() => setEditingChild(null)}
        />
      )}
    </div>
  )
}

// Add Child Modal Component
function AddChildModal({ userId, onClose }: { userId: any; onClose: () => void }) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addChild = useMutation(api.children.add)

  const platforms = [
    { id: 'facebook', name: 'Facebook', emoji: '📘' },
    { id: 'instagram', name: 'Instagram', emoji: '📷' },
    { id: 'discord', name: 'Discord', emoji: '💬' },
    { id: 'whatsapp', name: 'WhatsApp', emoji: '💚' },
  ]

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter a name')
      return
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform to monitor')
      return
    }

    setSaving(true)
    try {
      await addChild({
        userId,
        name: name.trim(),
        age: age ? parseInt(age) : undefined,
        platforms: selectedPlatforms,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to add child')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Child</h2>
            <p className="text-sm text-gray-600">Create a new child profile to monitor</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child's Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age (optional)
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter age"
              min="1"
              max="18"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platforms to Monitor *
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Select the platforms your child uses
            </p>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={`p-3 rounded-lg border-2 transition flex items-center gap-2 ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-xl">{platform.emoji}</span>
                  <span className="text-sm font-medium">{platform.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Child
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Child Modal Component
function EditChildModal({ child, onClose }: { child: any; onClose: () => void }) {
  const [name, setName] = useState(child.name)
  const [age, setAge] = useState(child.age?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateChild = useMutation(api.children.update)
  const removeChild = useMutation(api.children.remove)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter a name')
      return
    }

    setSaving(true)
    try {
      await updateChild({
        childId: child._id,
        name: name.trim(),
        age: age ? parseInt(age) : undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update child')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${child.name}? This will also delete all their incident history.`)) {
      return
    }

    setSaving(true)
    try {
      await removeChild({ childId: child._id })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to remove child')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Child</h2>
            <p className="text-sm text-gray-600">Update child profile information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child's Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age (optional)
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter age"
              min="1"
              max="18"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
