import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Shield, FileText, Download, Calendar, ArrowLeft, FileJson, FileSpreadsheet, File } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useUserSession } from '../utils/session'

export const Route = createFileRoute('/reports')({
  component: ExportReports,
})

function ExportReports() {
  const navigate = useNavigate()
  const { user: sessionUser, isAuthenticated } = useUserSession()
  const [exporting, setExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  // Form state
  const [exportType, setExportType] = useState<'pdf' | 'csv' | 'json'>('pdf')
  const [purpose, setPurpose] = useState<'personal_record' | 'law_enforcement' | 'backup'>('personal_record')
  const [dateRange, setDateRange] = useState('7')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

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

  // Get incidents for preview
  const incidents = useQuery(
    api.incidents.getRecent,
    user ? { limit: 100 } : 'skip'
  )

  const createExport = useMutation(api.exports.create)

  // Calculate date range
  const getDateRange = () => {
    const now = Date.now()
    let startDate: number
    let endDate = now

    if (dateRange === 'custom') {
      startDate = customStartDate ? new Date(customStartDate).getTime() : now - 7 * 24 * 60 * 60 * 1000
      endDate = customEndDate ? new Date(customEndDate).getTime() : now
    } else {
      const days = parseInt(dateRange)
      startDate = now - days * 24 * 60 * 60 * 1000
    }

    return { startDate, endDate }
  }

  // Filter incidents by date range
  const filteredIncidents = incidents?.filter(incident => {
    const { startDate, endDate } = getDateRange()
    return incident.timestamp >= startDate && incident.timestamp <= endDate
  }) || []

  const handleExport = async () => {
    if (!user) return

    setExporting(true)
    try {
      const { startDate, endDate } = getDateRange()

      const result = await createExport({
        userId: user._id,
        exportType,
        purpose,
        startDate,
        endDate,
      })

      // Generate and download the file
      if (exportType === 'json') {
        downloadJSON(filteredIncidents, `safeguard-report-${Date.now()}.json`)
      } else if (exportType === 'csv') {
        downloadCSV(filteredIncidents, `safeguard-report-${Date.now()}.csv`)
      } else {
        // For PDF, we'd normally generate on server
        // For now, create a simple text-based report
        downloadTextReport(filteredIncidents, `safeguard-report-${Date.now()}.txt`)
      }

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 5000)
    } catch (error) {
      console.error('Failed to export:', error)
      alert('Failed to create export')
    } finally {
      setExporting(false)
    }
  }

  // Download helpers
  const downloadJSON = (data: any[], filename: string) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    downloadBlob(blob, filename)
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No incidents to export')
      return
    }

    const headers = ['Timestamp', 'Platform', 'Category', 'Severity', 'Threat Level', 'Message']
    const rows = data.map(incident => [
      new Date(incident.timestamp).toISOString(),
      incident.platform,
      incident.category,
      incident.severity,
      incident.threatLevel,
      incident.messageText || ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    downloadBlob(blob, filename)
  }

  const downloadTextReport = (data: any[], filename: string) => {
    const lines = [
      '='.repeat(60),
      'SAFEGUARD KIDS - INCIDENT REPORT',
      '='.repeat(60),
      '',
      `Generated: ${new Date().toLocaleString()}`,
      `Total Incidents: ${data.length}`,
      `Purpose: ${purpose.replace(/_/g, ' ').toUpperCase()}`,
      '',
      '-'.repeat(60),
      '',
    ]

    data.forEach((incident, index) => {
      lines.push(`INCIDENT #${index + 1}`)
      lines.push(`Date: ${new Date(incident.timestamp).toLocaleString()}`)
      lines.push(`Platform: ${incident.platform}`)
      lines.push(`Category: ${incident.category}`)
      lines.push(`Severity: ${incident.severity} (Level ${incident.threatLevel})`)
      if (incident.messageText) {
        lines.push(`Content: ${incident.messageText}`)
      }
      if (incident.aiAnalysis?.agent4?.parentGuidance) {
        lines.push(`Guidance: ${incident.aiAnalysis.agent4.parentGuidance}`)
      }
      lines.push('')
      lines.push('-'.repeat(60))
      lines.push('')
    })

    lines.push('')
    lines.push('END OF REPORT')

    const text = lines.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    downloadBlob(blob, filename)
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
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
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Export Reports
                </h1>
                <p className="text-sm text-gray-600">
                  Generate reports for records or law enforcement
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date Range */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Date Range</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: '7', label: 'Last 7 days' },
                    { value: '30', label: 'Last 30 days' },
                    { value: '90', label: 'Last 90 days' },
                    { value: 'custom', label: 'Custom' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setDateRange(option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        dateRange === option.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Export Format */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h2>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setExportType('pdf')}
                  className={`p-4 rounded-lg border-2 transition text-center ${
                    exportType === 'pdf'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <File className={`w-8 h-8 mx-auto mb-2 ${
                    exportType === 'pdf' ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <p className="font-medium text-gray-900">PDF</p>
                  <p className="text-xs text-gray-500">Best for printing</p>
                </button>

                <button
                  onClick={() => setExportType('csv')}
                  className={`p-4 rounded-lg border-2 transition text-center ${
                    exportType === 'csv'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileSpreadsheet className={`w-8 h-8 mx-auto mb-2 ${
                    exportType === 'csv' ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <p className="font-medium text-gray-900">CSV</p>
                  <p className="text-xs text-gray-500">For spreadsheets</p>
                </button>

                <button
                  onClick={() => setExportType('json')}
                  className={`p-4 rounded-lg border-2 transition text-center ${
                    exportType === 'json'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileJson className={`w-8 h-8 mx-auto mb-2 ${
                    exportType === 'json' ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <p className="font-medium text-gray-900">JSON</p>
                  <p className="text-xs text-gray-500">Full data backup</p>
                </button>
              </div>
            </div>

            {/* Purpose */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Purpose</h2>

              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="personal_record">Personal Record</option>
                <option value="law_enforcement">Law Enforcement Report</option>
                <option value="backup">Data Backup</option>
              </select>

              {purpose === 'law_enforcement' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> This report includes all incident details and AI analysis.
                    Please consult with law enforcement about required documentation format before submitting.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview & Export */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Preview</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Incidents</span>
                  <span className="font-medium text-gray-900">{filteredIncidents.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Critical</span>
                  <span className="font-medium text-red-600">
                    {filteredIncidents.filter(i => i.severity === 'CRITICAL').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">High</span>
                  <span className="font-medium text-orange-600">
                    {filteredIncidents.filter(i => i.severity === 'HIGH').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Format</span>
                  <span className="font-medium text-gray-900 uppercase">{exportType}</span>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={exporting || filteredIncidents.length === 0}
              className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export Report
                </>
              )}
            </button>

            {exportSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm text-green-800 font-medium">
                  Report downloaded successfully!
                </p>
              </div>
            )}

            {filteredIncidents.length === 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  No incidents found in the selected date range.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
