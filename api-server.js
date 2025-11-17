import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// POST /api/incidents - Receive incidents from Chrome extension
app.post('/api/incidents', async (req, res) => {
  try {
    // Get API key from Authorization header
    const authHeader = req.headers.authorization
    const apiKey = authHeader?.replace('Bearer ', '')

    if (!apiKey) {
      return res.status(401).json({ error: 'Missing API key' })
    }

    const incident = req.body

    // Validate required fields
    if (!incident.extensionId) {
      return res.status(400).json({ error: 'Missing extensionId' })
    }

    // TODO: Validate API key against Convex
    // TODO: Store incident in Convex

    console.log('[API] Received incident:', {
      extensionId: incident.extensionId,
      severity: incident.severity,
      category: incident.category,
      timestamp: incident.timestamp,
    })

    // Return success
    res.json({
      success: true,
      incidentId: `incident_${Date.now()}`,
      message: 'Incident received successfully',
    })
  } catch (error) {
    console.error('[API] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/incidents - Test endpoint
app.get('/api/incidents', (req, res) => {
  const authHeader = req.headers.authorization
  const apiKey = authHeader?.replace('Bearer ', '')

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' })
  }

  res.json({
    status: 'ok',
    message: 'SafeGuard Kids API is running',
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`✅ API Server running on http://localhost:${PORT}`)
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/incidents`)
})
