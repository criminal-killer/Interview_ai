import { useState, useEffect } from 'react'
import { useUser, useClerk, SignOutButton } from '@clerk/clerk-react'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
  Crown,
  Loader2,
  Play
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://api-beta-three-38.vercel.app'

export default function Layout({ children }) {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData()
    }
  }, [isLoaded, user])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: { 'x-clerk-user-id': user.id }
      })

      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resumes', label: 'Resumes', icon: FileText },
    { id: 'jobs', label: 'Job Details', icon: Briefcase },
    { id: 'session', label: 'Interview', icon: Play },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  const planColors = {
    free: 'bg-slate-600',
    starter: 'bg-blue-600',
    pro: 'bg-purple-600',
    enterprise: 'bg-amber-600'
  }

  const displayUser = userData || {
    id: user?.id,
    email: user?.primaryEmailAddress?.emailAddress || '',
    name: user?.fullName || user?.firstName || 'User',
    plan: 'free',
    weeklyTimeUsed: 0
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Blinkora</h1>
                <p className="text-xs text-slate-400">AI Interview Assistant</p>
              </div>
            </div>
          </div>

          {/* Plan Badge */}
          <div className="p-4">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white ${planColors[displayUser.plan]}`}>
              {displayUser.plan === 'pro' || displayUser.plan === 'enterprise' ? <Crown className="w-3 h-3" /> : null}
              <span className="capitalize">{displayUser.plan || 'Free'} Plan</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                  window.dispatchEvent(new CustomEvent('navigate', { detail: item.id }))
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  activeTab === item.id
                    ? 'bg-primary text-white'
                    : 'text-slate-400 hover:text-white hover:bg-border'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {(displayUser.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{displayUser.name}</p>
                <p className="text-xs text-slate-400 truncate">{displayUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-white">Blinkora</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <div className="p-6">
          {React.cloneElement(children, { userData, setUserData, activeTab, setActiveTab, user })}
        </div>
      </main>
    </div>
  )
}

// Import React for JSX
import React from 'react'
