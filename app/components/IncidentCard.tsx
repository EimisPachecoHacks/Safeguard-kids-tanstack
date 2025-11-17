import { AlertTriangle, Clock, MapPin, Eye, CheckCircle } from 'lucide-react'
import { Doc } from '../../convex/_generated/dataModel'
import { formatDistanceToNow } from 'date-fns'

interface IncidentCardProps {
  incident: Doc<'incidents'>
}

export function IncidentCard({ incident }: IncidentCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      sexual_content: 'Sexual Content',
      grooming: 'Grooming Pattern',
      personal_info_request: 'Personal Info Request',
      meeting_request: 'Meeting Request',
      manipulation: 'Manipulation',
      age_inappropriate: 'Age Inappropriate',
    }
    return labels[category] || category
  }

  const getPlatformEmoji = (platform: string) => {
    const emojis: Record<string, string> = {
      facebook: '📘',
      instagram: '📷',
      discord: '💬',
      whatsapp: '💚',
      twitter: '🐦',
      snapchat: '👻',
    }
    return emojis[platform.toLowerCase()] || '🌐'
  }

  return (
    <div className={`p-6 hover:bg-gray-50 transition ${!incident.viewed ? 'bg-blue-50/30' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Severity Indicator */}
        <div className={`flex-shrink-0 w-1 h-full rounded-full ${
          incident.severity === 'CRITICAL' ? 'bg-red-500' :
          incident.severity === 'HIGH' ? 'bg-orange-500' :
          incident.severity === 'MEDIUM' ? 'bg-yellow-500' :
          'bg-gray-400'
        }`} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                  {incident.severity}
                </span>
                <span className="text-sm text-gray-600">
                  Level {incident.threatLevel}/10
                </span>
                {!incident.viewed && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    NEW
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                {getCategoryLabel(incident.category)}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {incident.acknowledged && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                <Eye className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span>{getPlatformEmoji(incident.platform)}</span>
              <span className="capitalize">{incident.platform}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDistanceToNow(incident.timestamp, { addSuffix: true })}</span>
            </div>

            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{incident.incidentType === 'message' ? 'Text Message' : 'Image'}</span>
            </div>
          </div>

          {/* Content Preview */}
          {incident.messageText && (
            <div className="bg-gray-100 rounded-lg p-4 mb-3">
              <p className="text-sm text-gray-800 line-clamp-2">
                "{incident.messageText}"
              </p>
            </div>
          )}

          {incident.imageDescription && (
            <div className="bg-gray-100 rounded-lg p-4 mb-3">
              <p className="text-sm text-gray-700">
                <strong>Image:</strong> {incident.imageDescription}
              </p>
            </div>
          )}

          {/* AI Analysis */}
          {incident.aiAnalysis.agent4 && (
            <div className="mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Parent Guidance:
                  </p>
                  <p className="text-sm text-gray-700">
                    {incident.aiAnalysis.agent4.parentGuidance}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Red Flags */}
          {incident.aiAnalysis.agent1?.redFlags && incident.aiAnalysis.agent1.redFlags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {incident.aiAnalysis.agent1.redFlags.map((flag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200"
                >
                  {flag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition">
              View Details
            </button>

            {!incident.acknowledged && (
              <button className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition">
                Mark as Reviewed
              </button>
            )}

            <button className="px-4 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition">
              Add Notes
            </button>

            <button className="px-4 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition">
              Export
            </button>
          </div>

          {/* Notifications Status */}
          {(incident.emailSent || incident.smsSent) && (
            <div className="mt-3 flex gap-3 text-xs text-gray-600">
              {incident.emailSent && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Email sent
                </span>
              )}
              {incident.smsSent && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  SMS sent
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
