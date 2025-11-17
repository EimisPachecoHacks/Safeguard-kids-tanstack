import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useUserSession } from '../utils/session'

export const Route = createFileRoute('/logout')({
  component: LogoutPage,
})

function LogoutPage() {
  const navigate = useNavigate()
  const { logout } = useUserSession()

  useEffect(() => {
    // Clear session
    logout()

    // Redirect to login
    navigate({ to: '/login' })
  }, [logout, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Logging out...</p>
      </div>
    </div>
  )
}
