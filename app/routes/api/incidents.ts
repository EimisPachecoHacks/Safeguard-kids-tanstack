import { createFileRoute } from '@tanstack/react-router'

/**
 * API Route: /api/incidents
 *
 * Receives incidents from Chrome extension and stores them in Convex
 */
export const Route = createFileRoute('/api/incidents')({
  server: {
    handlers: {
      /**
       * POST /api/incidents
       * Receive incident from Chrome extension
       */
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get('Authorization')
          const apiKey = authHeader?.replace('Bearer ', '')

          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: 'Missing API key' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const incident = await request.json()

          if (!incident.extensionId) {
            return new Response(
              JSON.stringify({ error: 'Missing extensionId' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          console.log('[API] Received incident:', {
            extensionId: incident.extensionId,
            severity: incident.severity,
            category: incident.category,
            timestamp: incident.timestamp,
          })

          return new Response(
            JSON.stringify({
              success: true,
              incidentId: `incident_${Date.now()}`,
              message: 'Incident received successfully',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('[API] Error:', error)
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },

      GET: async ({ request }) => {
        const authHeader = request.headers.get('Authorization')
        const apiKey = authHeader?.replace('Bearer ', '')

        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: 'Missing API key' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({
            status: 'ok',
            message: 'SafeGuard Kids API is running',
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      },
    },
  },
})
