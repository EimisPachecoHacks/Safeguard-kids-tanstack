import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/debug')({
  component: DebugPage,
})

function DebugPage() {
  const users = useQuery(api.debug.listAllUsers)
  const count = useQuery(api.debug.countUsers)
  const incidents = useQuery(api.debug.listAllIncidents)
  const deleteUser = useMutation(api.debug.deleteUserByEmail)
  const deleteAllIncidents = useMutation(api.debug.deleteAllIncidents)
  const createSampleIncidents = useMutation(api.seed.createSampleIncidents)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Database Debug Info</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Count</h2>
          {count === undefined ? (
            <p>Loading...</p>
          ) : (
            <p className="text-2xl font-bold text-purple-600">{count.count} users</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">All Users</h2>
          {users === undefined ? (
            <p>Loading...</p>
          ) : users.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">⚠️ No users found in database</p>
              <p className="text-sm text-yellow-700 mt-2">
                You need to register through the Chrome extension first!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium text-gray-700">Email:</div>
                    <div className="text-gray-900">{user.email}</div>

                    <div className="font-medium text-gray-700">Name:</div>
                    <div className="text-gray-900">{user.name}</div>

                    <div className="font-medium text-gray-700">Has Password Hash:</div>
                    <div className={user.hasPasswordHash ? "text-green-600" : "text-red-600"}>
                      {user.hasPasswordHash ? "✓ Yes" : "✗ No"}
                    </div>

                    <div className="font-medium text-gray-700">Has Password Salt:</div>
                    <div className={user.hasPasswordSalt ? "text-green-600" : "text-red-600"}>
                      {user.hasPasswordSalt ? "✓ Yes" : "✗ No"}
                    </div>

                    <div className="font-medium text-gray-700">Hash Length:</div>
                    <div className="text-gray-900">{user.passwordHashLength} chars</div>

                    <div className="font-medium text-gray-700">Salt Length:</div>
                    <div className="text-gray-900">{user.passwordSaltLength} chars</div>

                    <div className="font-medium text-gray-700">Created:</div>
                    <div className="text-gray-900">
                      {new Date(user.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (confirm(`Delete user ${user.email}?`)) {
                        try {
                          await deleteUser({ email: user.email });
                          alert(`User ${user.email} deleted successfully!`);
                        } catch (error) {
                          alert(`Error: ${error.message}`);
                        }
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete User
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">All Incidents</h2>
          {incidents === undefined ? (
            <p>Loading...</p>
          ) : incidents.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">⚠️ No incidents found in database</p>
              <p className="text-sm text-yellow-700 mt-2 mb-4">
                Create sample incidents for testing the dashboard
              </p>
              {users && users.length > 0 && (
                <button
                  onClick={async () => {
                    try {
                      await createSampleIncidents({ userId: users[0]._id });
                      alert('Sample incidents created! Check the dashboard.');
                    } catch (error) {
                      alert(`Error: ${error.message}`);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  Create Sample Incidents for {users[0].email}
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-2xl font-bold text-purple-600">{incidents.length} incidents</p>
                <button
                  onClick={async () => {
                    if (confirm('Delete all incidents? This cannot be undone.')) {
                      try {
                        await deleteAllIncidents({});
                        alert('All incidents deleted!');
                      } catch (error) {
                        alert(`Error: ${error.message}`);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Delete All Incidents
                </button>
              </div>
              <div className="space-y-2">
                {incidents.map((incident) => (
                  <div key={incident._id} className="border border-gray-200 rounded-lg p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium text-gray-700">Severity:</div>
                      <div className={
                        incident.severity === 'CRITICAL' ? 'text-red-600 font-bold' :
                        incident.severity === 'HIGH' ? 'text-orange-600 font-bold' :
                        incident.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-gray-600'
                      }>{incident.severity}</div>

                      <div className="font-medium text-gray-700">Platform:</div>
                      <div className="text-gray-900">{incident.platform}</div>

                      <div className="font-medium text-gray-700">Category:</div>
                      <div className="text-gray-900">{incident.category}</div>

                      <div className="font-medium text-gray-700">User ID:</div>
                      <div className="text-gray-900 text-xs">{incident.userId}</div>

                      <div className="font-medium text-gray-700">Viewed:</div>
                      <div className={incident.viewed ? "text-green-600" : "text-red-600"}>
                        {incident.viewed ? "✓ Yes" : "✗ No"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Expected Values for Proper Auth:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Password Hash Length: 64 characters (PBKDF2 SHA-256 hex)</li>
            <li>• Password Salt Length: 32 characters (16 bytes hex)</li>
            <li>• Both must be present for login to work</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
