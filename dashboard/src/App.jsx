import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import Auth from './components/Auth'
import Dashboard from './pages/Dashboard'

function App() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Create user object from Clerk data
      setUser({
        id: userId,
        email: '',
        name: '',
        plan: 'free'
      })
      setLoading(false)
    } else if (isLoaded && !isSignedIn) {
      setUser(null)
      setLoading(false)
    }
  }, [isLoaded, isSignedIn, userId])

  const handleLogout = async () => {
    // Clerk handles logout via signOut()
    window.location.reload()
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App
