import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import Auth from './components/Auth'
import Dashboard from './pages/Dashboard'

function App() {
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // User is signed in - redirect to dashboard is handled by Dashboard component
    }
  }, [isLoaded, isSignedIn])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Auth />
  }

  return <Dashboard />
}

export default App
