import { useState } from 'react'
import { Briefcase, Building, FileText, Save, Sparkles } from 'lucide-react'

export default function JobSection({ resumeCount = 1 }) {
  const [job, setJob] = useState({
    company: '',
    position: '',
    description: ''
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (job.company || job.position || job.description) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Job Details
          </h3>
          <p className="text-sm text-slate-400 mt-1">Enter the position you're interviewing for</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {saved ? (
            <>
              <Sparkles className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Building className="w-4 h-4" />
            Company Name
          </label>
          <input
            type="text"
            placeholder="e.g., Google, Meta, Amazon"
            value={job.company}
            onChange={(e) => setJob({ ...job, company: e.target.value })}
            className="w-full px-4 py-3 bg-dark border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Briefcase className="w-4 h-4" />
            Position / Job Title
          </label>
          <input
            type="text"
            placeholder="e.g., Software Engineer, Product Manager"
            value={job.position}
            onChange={(e) => setJob({ ...job, position: e.target.value })}
            className="w-full px-4 py-3 bg-dark border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <FileText className="w-4 h-4" />
            Job Description
          </label>
          <textarea
            placeholder="Paste the job description here for better, more targeted answers..."
            rows={8}
            value={job.description}
            onChange={(e) => setJob({ ...job, description: e.target.value })}
            className="w-full px-4 py-3 bg-dark border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none resize-none transition-colors"
          />
          <p className="text-xs text-slate-500 mt-2">
            The more details you provide, the better the AI can tailor answers to match the role
          </p>
        </div>
      </div>

      {/* Preview Match */}
      {(job.company || job.position) && (
        <div className="mt-6 p-4 bg-dark rounded-lg border border-primary/30">
          <h4 className="text-sm font-medium text-white mb-2">AI Match Preview</h4>
          <div className="text-sm text-slate-400">
            <p>When you start an interview, the AI will:</p>
            <ul className="mt-2 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Align answers with your resume ({resumeCount} loaded)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Target {job.position || 'your target position'}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Match {job.company || 'your target company'}'s values
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}