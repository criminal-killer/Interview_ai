import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Briefcase, Building, Save, Check } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://api-beta-three-38.vercel.app'

export default function JobsPage({ userData, setUserData }) {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    position: userData?.jobDetails?.position || '',
    company: userData?.jobDetails?.company || '',
    description: userData?.jobDetails?.description || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Refresh user data
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
      console.error('Failed to save job:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasJobDetails = formData.position || formData.company || formData.description

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Job Details</h1>
        <p className="text-slate-400 mt-1">Enter the job you're interviewing for personalized answers</p>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Position / Title</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g., Senior Software Engineer"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-dark border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Company</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g., Google, Meta, Startup..."
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-dark border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Job Description</label>
            <textarea
              placeholder="Paste the job description here for the most accurate answers..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-dark border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none h-48 resize-none"
            />
          </div>

          <button
            type="submit"
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
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Job Details'}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Current Job Preview */}
      {userData?.jobDetails?.position && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Current Job</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary" />
              <span className="text-white">{userData.jobDetails.position}</span>
            </div>
            {userData.jobDetails.company && (
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-blue-500" />
                <span className="text-white">{userData.jobDetails.company}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
