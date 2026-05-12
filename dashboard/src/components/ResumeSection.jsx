import { useState } from 'react'
import { FileText, Plus, Trash2, Upload, Check, Edit2 } from 'lucide-react'

export default function ResumeSection() {
  const [resumes, setResumes] = useState([
    { id: 1, name: 'Software Engineer - Google', content: 'Experienced software engineer with 5 years in tech...', active: true },
    { id: 2, name: 'Product Manager - Meta', content: 'Product leader with experience in social media...', active: false }
  ])
  const [showForm, setShowForm] = useState(false)
  const [newResume, setNewResume] = useState({ name: '', content: '' })

  const handleAddResume = () => {
    if (!newResume.name || !newResume.content) return

    setResumes([...resumes, {
      id: Date.now(),
      name: newResume.name,
      content: newResume.content,
      active: false
    }])
    setNewResume({ name: '', content: '' })
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setResumes(resumes.filter(r => r.id !== id))
  }

  const handleSetActive = (id) => {
    setResumes(resumes.map(r => ({ ...r, active: r.id === id })))
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Your Resumes
          </h3>
          <p className="text-sm text-slate-400 mt-1">Add your resumes for personalized answers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Resume
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-dark rounded-lg border border-border">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Resume Label</label>
              <input
                type="text"
                placeholder="e.g., Software Engineer - Google"
                value={newResume.name}
                onChange={(e) => setNewResume({ ...newResume, name: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Resume Content</label>
              <textarea
                placeholder="Paste your resume text here..."
                rows={6}
                value={newResume.content}
                onChange={(e) => setNewResume({ ...newResume, content: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddResume}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                Save Resume
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-border text-slate-400 rounded-lg text-sm font-medium hover:bg-border/80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume List */}
      <div className="space-y-3">
        {resumes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No resumes added yet</p>
            <p className="text-sm mt-1">Add your first resume to get started</p>
          </div>
        ) : (
          resumes.map(resume => (
            <div
              key={resume.id}
              className={`p-4 bg-dark rounded-lg border transition-all cursor-pointer ${
                resume.active ? 'border-green-500' : 'border-border hover:border-primary'
              }`}
              onClick={() => handleSetActive(resume.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    resume.active ? 'bg-green-500 border-green-500' : 'border-slate-500'
                  }`}>
                    {resume.active && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{resume.name}</h4>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{resume.content}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(resume.id); }}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-dark/50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {resume.active && (
                <div className="mt-3 ml-8">
                  <span className="text-xs text-green-500 font-medium">Active for this interview</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Upload File Option */}
      <div className="mt-4 border-t border-border pt-4">
        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
          <Upload className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-400">Upload PDF or DOCX file</span>
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" />
        </label>
      </div>
    </div>
  )
}