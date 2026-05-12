import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import Auth from './components/Auth'
import Layout from './Layout'
import DashboardPage from './pages/DashboardPage'
import ResumesPage from './pages/ResumesPage'
import JobsPage from './pages/JobsPage'
import SettingsPage from './pages/SettingsPage'
import BillingPage from './pages/BillingPage'

function App() {
  const { isLoaded, isSignedIn } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const handleNavigate = (e) => {
      setActiveTab(e.detail)
    }
    window.addEventListener('navigate', handleNavigate)
    return () => window.removeEventListener('navigate', handleNavigate)
  }, [])

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

  const renderPage = (activeTab, props) => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage {...props} />
      case 'resumes':
        return <ResumesPage {...props} />
      case 'jobs':
        return <JobsPage {...props} />
      case 'settings':
        return <SettingsPage {...props} />
      case 'billing':
        return <BillingPage {...props} />
      default:
        return <DashboardPage {...props} />
    }
  }

  return (
    <Layout>
      {renderPage(activeTab, { activeTab, setActiveTab })}
    </Layout>
  )
}

export default App
