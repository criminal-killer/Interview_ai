import { FileText, Briefcase, Download, ChevronRight, Check, Zap } from 'lucide-react'

export default function DashboardPage({ userData, activeTab, setActiveTab }) {
  const weeklyLimit = userData?.plan === 'starter' ? 1800000 :
                      userData?.plan === 'pro' ? Infinity : 600000

  const weeklyUsed = userData?.weeklyTimeUsed || 0
  const weeklyPercent = weeklyLimit === Infinity ? 0 : Math.min((weeklyUsed / weeklyLimit) * 100, 100)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {userData?.name || 'User'}!</h1>
        <p className="text-slate-400 mt-1">Here's your interview assistant overview</p>
      </div>

      {/* Weekly Time */}
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
              {weeklyLimit === Infinity ? '∞' : formatTime(weeklyUsed)}
            </span>
            {weeklyLimit !== Infinity && (
              <span className="text-slate-400"> / {formatTime(weeklyLimit)}</span>
            )}
          </div>
        </div>
        {weeklyLimit !== Infinity && (
          <div className="h-3 bg-dark rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${weeklyPercent > 80 ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-secondary'}`}
              style={{ width: `${weeklyPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('resumes')}
          className="bg-card rounded-xl p-6 border border-border hover:border-primary transition-colors text-left"
        >
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-white font-semibold mb-1">Upload Resume</h3>
          <p className="text-sm text-slate-400">Add your resume for personalized answers</p>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className="bg-card rounded-xl p-6 border border-border hover:border-primary transition-colors text-left"
        >
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-white font-semibold mb-1">Job Details</h3>
          <p className="text-sm text-slate-400">Enter the job you're interviewing for</p>
        </button>

        <button className="bg-card rounded-xl p-6 border border-border hover:border-primary transition-colors text-left">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
            <Download className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="text-white font-semibold mb-1">Chrome Extension</h3>
          <p className="text-sm text-slate-400">Install the extension for interviews</p>
        </button>
      </div>

      {/* Getting Started */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Getting Started
        </h3>
        <div className="space-y-4">
          {[
            { step: 1, title: 'Upload your resume', desc: 'Help AI give personalized answers', done: (userData?.resumes?.length || 0) > 0 },
            { step: 2, title: 'Add job details', desc: 'Enter the position you are interviewing for', done: !!userData?.jobDetails?.position },
            { step: 3, title: 'Install Chrome extension', desc: 'Use during your next interview', done: false },
          ].map(item => (
            <div key={item.step} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.done ? 'bg-green-500' : 'bg-border'}`}>
                {item.done ? <Check className="w-4 h-4 text-white" /> : <span className="text-white text-sm">{item.step}</span>}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium">{item.title}</h4>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
