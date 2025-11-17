interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  color: 'blue' | 'red' | 'orange' | 'green'
  subtitle?: string
}

export function StatCard({ icon, title, value, color, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
  }

  const formatValue = (val: string | number) => {
    if (typeof val === 'string') {
      return val.charAt(0).toUpperCase() + val.slice(1)
    }
    return val.toLocaleString()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-purple-200 transition">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>

      {subtitle && (
        <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  )
}
