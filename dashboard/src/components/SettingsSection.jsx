import { useState } from 'react'
import { Settings, Eye, Bell, Mic, Zap, Key, Check } from 'lucide-react'

export default function SettingsSection() {
  const [settings, setSettings] = useState({
    stealthMode: true,
    autoDetect: true,
    notifications: true,
    speechRate: 0.9,
    customApiKey: '',
    aiProvider: 'groq'
  })

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] })
  }

  return (
    <div className="space-y-6">
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
              <option value="groq">Groq (Free, Fast)</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="google">Google (Gemini)</option>
              <option value="openrouter">OpenRouter (Multi-provider)</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2">Custom API Key (optional)</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                placeholder="Enter your API key for more options"
                value={settings.customApiKey}
                onChange={(e) => setSettings({ ...settings, customApiKey: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-dark border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Use your own API key for access to premium models
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
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.stealthMode ? 'bg-primary' : 'bg-border'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
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
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.notifications ? 'bg-primary' : 'bg-border'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
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
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.autoDetect ? 'bg-primary' : 'bg-border'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
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
            <span>Faster</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
        Save Settings
      </button>
    </div>
  )
}