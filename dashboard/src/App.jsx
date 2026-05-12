import { useState } from 'react'
import Auth from './components/Auth'
import Dashboard from './pages/Dashboard'

function App() {
  const [user, setUser] = useState(null)

  const handleAuth = (userData) => {
    setUser(userData)
    // Save to localStorage for persistence
    localStorage.setItem('interviewace_user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('interviewace_user')
  }

  // Check for existing session
  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('interviewace_user') : null
  const initialUser = savedUser ? JSON.parse(savedUser) : user

  if (!initialUser) {
    return <Auth onAuth={handleAuth} />
  }

  return <Dashboard user={initialUser} onLogout={handleLogout} />
}

export default App