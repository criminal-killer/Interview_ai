import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Settings, Eye, Bell, Mic, Zap, Key, Save, Check } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://api-beta-three-38.vercel.app'

export default function SettingsPage({ userData, setUserData }) {
  const { user } = useUser()
  const [settings, setSettings] = useState({
    stealthMode: true,
    autoDetect: true,
    notifications: true,
    speechRate: 0.9,
    aiProvider: 'groq'
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (userData?.settings) {
      setSettings(prev => ({ ...prev, ...userData.settings }))
    }
  }, [userData])

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        const profileRes = await fetch(`${API_URL}/api/user/profile`, {
          headers: { 'x-clerk-user-id': user.id }
        })
        if (profileRes.ok) {
          const data = await profileRes.json()
          setUserData(data)
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Configure your interview assistant preferences</p>
      </div>

      {/* AI Settings */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          AI Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">AI Provider</label>
            <select
              value={settings.aiProvider}
              onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
              className="w-full px-4 py-3 bg-dark border border-border rounded-lg text-white focus:border-primary focus:outline-none"
            >
              <option value="groq">Groq (Free, Fast - Recommended)</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="google">Google (Gemini)</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Groq uses Llama models and is free with generous limits
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          Privacy & Stealth
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-dark rounded-lg">
            <div>
              <h4 className="text-white font-medium">Stealth Mode</h4>
              <p className="text-sm text-slate-400">Hide extension during screen share</p>
            </div>
            <button
              onClick={() => handleToggle('stealthMode')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.stealthMode ? 'bg-primary' : 'bg-border'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                settings.stealthMode ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-dark rounded-lg">
            <div>
              <h4 className="text-white font-medium">Question Alerts</h4>
              <p className="text-sm text-slate-400">Get notified when a question is detected</p>
            </div>
            <button
              onClick={() => handleToggle('notifications')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.notifications ? 'bg-primary' : 'bg-border'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-dark rounded-lg">
            <div>
              <h4 className="text-white font-medium">Auto-detect Meetings</h4>
              <p className="text-sm text-slate-400">Automatically detect video calls</p>
            </div>
            <button
              onClick={() => handleToggle('autoDetect')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.autoDetect ? 'bg-primary' : 'bg-border'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                settings.autoDetect ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Audio Settings */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          Speech Settings
        </h3>

        <div>
          <label className="text-sm text-slate-400 mb-4 block">
            Speech Rate: {settings.speechRate}x
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={settings.speechRate}
            onChange={(e) => setSettings({ ...settings, speechRate: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Slower</span>
            <span>Normal (1.0x)</span>
            <span>Faster</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-primary text-white hover:bg-primary/90'
        }`}
      >
        {saved ? (
          <>
            <Check className="w-5 h-5" />
            Settings Saved!
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Settings'}
          </>
        )}
      </button>
    </div>
  )
}
