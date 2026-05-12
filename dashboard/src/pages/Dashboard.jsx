import { useState, useEffect } from 'react'
import Header from '../components/Header'
import ResumeSection from '../components/ResumeSection'
import JobSection from '../components/JobSection'
import SettingsSection from '../components/SettingsSection'
import PricingSection from '../components/PricingSection'
import { BookOpen, Settings, CreditCard, Download, ChevronRight, Check } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://api-beta-three-38.vercel.app'

export default function Dashboard({ clerkUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('setup')
  const [resumeCount, setResumeCount] = useState(2)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clerkUser) {
      fetchUserData()
    }
  }, [clerkUser])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: {
          'x-clerk-user-id': clerkUser.id
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      } else {
        console.warn('Failed to fetch user data, using Clerk data only')
        // Use Clerk data as fallback
        setUserData({
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          name: clerkUser.fullName || clerkUser.firstName || 'User',
          plan: 'free',
          weeklyTimeUsed: 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      // Use Clerk data as fallback
      setUserData({
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        plan: 'free',
        weeklyTimeUsed: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const displayUser = userData || {
    id: clerkUser?.id,
    email: clerkUser?.primaryEmailAddress?.emailAddress || '',
    name: clerkUser?.fullName || clerkUser?.firstName || 'User',
    plan: 'free',
    weeklyTimeUsed: 0,
    weeklyLimit: 600000
  }

  const weeklyLimit = displayUser.plan === 'starter' ? 1800000 :
                      displayUser.plan === 'pro' ? Infinity :
                      600000 // 10 minutes free

  return (
    <div className="min-h-screen bg-dark">
      <Header user={displayUser} onLogout={onLogout} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Check className="w-4 h-4 text-green-500" />
            <span>Account Created</span>
            <ChevronRight className="w-4 h-4" />
            <span className={displayUser.plan !== 'free' ? 'text-green-500' : ''}>
              {displayUser.plan !== 'free' ? 'Subscribed' : 'Free Plan'}
            </span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-primary">Setup Complete</span>
          </div>

          {/* Weekly Time Card */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Weekly Interview Time</h3>
                <p className="text-sm text-slate-400">
                  {weeklyLimit === Infinity ? 'Unlimited access' : 'Resets every Monday'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">
                  {weeklyLimit === Infinity ? '∞' : formatTime(displayUser.weeklyTimeUsed || 0)}
                </span>
                {weeklyLimit !== Infinity && (
                  <span className="text-slate-400"> / {formatTime(weeklyLimit)}</span>
                )}
              </div>
            </div>
            {weeklyLimit !== Infinity && (
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                  style={{ width: `${Math.min((displayUser.weeklyTimeUsed / weeklyLimit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-card p-2 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-white hover:bg-border'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeTab === 'setup' && (
            <>
              <div className="lg:col-span-2 space-y-6">
                <ResumeSection />
                <JobSection resumeCount={resumeCount} />
              </div>
              <div className="space-y-6">
                <InstallExtension />
                <PricingSection compact />
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <div className="lg:col-span-3">
              <SettingsSection />
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="lg:col-span-3">
              <PricingSection />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

const tabs = [
  { id: 'setup', label: 'Setup', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

function InstallExtension() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-lg font-semibold text-white mb-4">Install Chrome Extension</h3>
      <p className="text-sm text-slate-400 mb-4">
        Download and install the InterviewAce extension to use during your interviews.
      </p>
      <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
        <Download className="w-4 h-4" />
        Download Extension
      </button>
      <div className="mt-4 text-xs text-slate-500">
        Works on Chrome, Edge, and Brave browsers
      </div>
    </div>
  )
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
