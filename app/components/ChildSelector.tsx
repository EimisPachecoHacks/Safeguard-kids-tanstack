import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Users, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface ChildSelectorProps {
  selectedChildId: string | null
  onSelectChild: (childId: string | null) => void
}

export function ChildSelector({ selectedChildId, onSelectChild }: ChildSelectorProps) {
  const user = useQuery(api.users.getTestUser)
  const children = user ? useQuery(api.children.getAll, { userId: user._id }) : undefined
  const [isOpen, setIsOpen] = useState(false)

  if (!user || !children || children.length === 0) {
    return null
  }

  const selectedChild = selectedChildId
    ? children.find(c => c._id === selectedChildId)
    : null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        <Users className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-gray-900">
          {selectedChild ? selectedChild.name : 'All Children'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
            <button
              onClick={() => {
                onSelectChild(null)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-200 ${
                !selectedChildId ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold">
                  All
                </div>
                <div>
                  <p className="font-semibold text-gray-900">All Children</p>
                  <p className="text-xs text-gray-600">
                    {children.length} {children.length === 1 ? 'child' : 'children'}
                  </p>
                </div>
              </div>
            </button>

            {children.map((child) => (
              <button
                key={child._id}
                onClick={() => {
                  onSelectChild(child._id)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition ${
                  selectedChildId === child._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {child.avatar ? (
                    <img
                      src={child.avatar}
                      alt={child.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{child.name}</p>
                    {child.age && (
                      <p className="text-xs text-gray-600">Age {child.age}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
