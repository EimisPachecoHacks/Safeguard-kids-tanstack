interface ThreatChartProps {
  data: Record<string, number>
  type: 'platform' | 'category'
}

export function ThreatChart({ data, type }: ThreatChartProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const maxValue = Math.max(...entries.map(([_, count]) => count), 1)

  const getColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
    ]
    return colors[index % colors.length]
  }

  const formatLabel = (key: string) => {
    if (type === 'platform') {
      // Map platform keys to display names
      const platformNames: Record<string, string> = {
        'facebook': 'Facebook',
        'instagram': 'Instagram',
        'discord': 'Discord',
        'whatsapp': 'WhatsApp',
        'twitter': 'Twitter/X',
        'snapchat': 'Snapchat',
        'tiktok': 'TikTok',
        'youtube': 'YouTube',
        'text_message': 'WhatsApp',
        'text message': 'WhatsApp',
        'textmessage': 'WhatsApp',
        'sms': 'WhatsApp',
      }
      return platformNames[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1)
    }
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map(([key, count], index) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {formatLabel(key)}
            </span>
            <span className="text-sm font-semibold text-gray-900">{count}</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getColor(index)}`}
              style={{ width: `${(count / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
