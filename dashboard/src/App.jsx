import { useAuth, useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import Auth from './components/Auth'
import Dashboard from './pages/Dashboard'

const API_URL = import.meta.env.VITE_API_URL || 'https://api-beta-three-38.vercel.app'

function App() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Wait for Clerk to load
    if (!isLoaded) return

    setLoading(false)
  }, [isLoaded])

  const handleLogout = async () => {
    window.location.reload()
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Auth />
  }

  // User is signed in - pass Clerk user to Dashboard
  return (
    <Dashboard
      clerkUser={user}
      onLogout={handleLogout}
    />
  )
}

export default App
