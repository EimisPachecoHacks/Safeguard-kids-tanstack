import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { ConvexClientProvider } from '../convex-client'
import { useUserSession } from '../utils/session'
import '../styles/globals.css'
import { Shield } from 'lucide-react'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { user, isAuthenticated } = useUserSession()

  return (
    <ConvexClientProvider>
      <div className="min-h-screen bg-gray-50 font-sans antialiased">
        {/* Global Navigation - Only show on authenticated routes */}
        {isAuthenticated && (
          <header className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-white" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">SafeGuard Kids</h1>
                    <p className="text-sm text-purple-100">Parent Dashboard</p>
                  </div>
                </Link>

                <div className="flex items-center gap-4">
                  <Link
                    to="/dashboard"
                    className="text-white hover:text-purple-100 transition"
                    activeProps={{
                      className: 'font-bold',
                    }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/children"
                    className="text-white hover:text-purple-100 transition"
                    activeProps={{
                      className: 'font-bold',
                    }}
                  >
                    Children
                  </Link>
                  <Link
                    to="/account"
                    className="text-white hover:text-purple-100 transition"
                    activeProps={{
                      className: 'font-bold',
                    }}
                  >
                    Account
                  </Link>
                  <div className="ml-4 pl-4 border-l border-white/20">
                    <span className="text-white text-sm mr-3">{user?.email}</span>
                    <Link
                      to="/logout"
                      className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition shadow-sm"
                    >
                      Logout
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}

        <Outlet />
      </div>
    </ConvexClientProvider>
  )
}
