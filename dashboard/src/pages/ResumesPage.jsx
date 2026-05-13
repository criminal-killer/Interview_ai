import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { FileText, Plus, Trash2, AlertCircle } from 'lucide-react'
import { API } from '../config'

export default function ResumesPage({ userData, setUserData, activeTab }) {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', content: '' })
  const [error, setError] = useState('')

  const resumes = userData?.resumes || []
  const resumeLimit = userData?.resumeLimit || 2
  const canAddMore = resumes.length < resumeLimit || resumeLimit === Infinity

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.content) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API.url}${API.endpoints.resumes}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403 && data.upgrade) {
          setError(`Resume limit reached (${resumes.length}/${resumeLimit}). Upgrade to add more.`)
        } else {
          setError(data.error || 'Failed to add resume')
        }
        return
      }

      // Refresh user data
      const profileRes = await fetch(`${API.url}${API.endpoints.profile}`, {
        headers: { 'x-clerk-user-id': user.id }
      })
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setUserData(profileData)
      }
      setFormData({ name: '', content: '' })
      setShowForm(false)
    } catch (error) {
      console.error('Failed to add resume:', error)
      setError('Failed to add resume')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this resume?')) return

    try {
      await fetch(`${API.url}/api/resumes/${id}`, {
        method: 'DELETE',
        headers: { 'x-clerk-user-id': user.id }
      })

      // Refresh user data
      const profileRes = await fetch(`${API.url}${API.endpoints.profile}`, {
        headers: { 'x-clerk-user-id': user.id }
      })
      if (profileRes.ok) {
        const data = await profileRes.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Failed to delete resume:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Resumes</h1>
          <p className="text-slate-400 mt-1">
            {resumeLimit === Infinity
              ? 'Unlimited resumes'
              : `${resumes.length}/${resumeLimit} resumes used`
            }
          </p>
        </div>
        {canAddMore && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Resume
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Add Form */}
      {showForm && canAddMore && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Resume</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Resume Name</label>
              <input
                type="text"
                placeholder="e.g., Software Engineer Resume"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-dark border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Resume Content</label>
              <textarea
                placeholder="Paste your resume content here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-3 bg-dark border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none h-64 resize-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Resume'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError('') }}
                className="px-6 py-2 bg-border text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resume Limit Reached */}
      {!canAddMore && (
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Resume Limit Reached</h3>
          <p className="text-slate-400 mb-4">
            Your free plan allows {resumeLimit} resumes. Upgrade to add more.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'billing' }))}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Resume List */}
      {resumes.length === 0 && !showForm ? (
        <div className="bg-card rounded-xl p-12 border border-border text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No resumes yet</h3>
          <p className="text-slate-400 mb-6">Add your resume to get personalized interview answers</p>
          {canAddMore && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Resume
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes.map((resume, i) => (
            <div key={resume.id || i} className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{resume.name}</h3>
                    <p className="text-xs text-slate-400">
                      Added {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(resume.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-dark rounded-lg p-4 max-h-32 overflow-hidden">
                <p className="text-sm text-slate-400 line-clamp-4">
                  {resume.content?.substring(0, 300)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}