import { LogOut, User, Crown, ChevronDown } from 'lucide-react'

export default function Header({ user, onLogout }) {
  const planColors = {
    free: 'bg-slate-600',
    starter: 'bg-blue-600',
    pro: 'bg-purple-600',
    enterprise: 'bg-amber-600'
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">IA</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">InterviewAce</h1>
              <p className="text-xs text-slate-400">Your AI Interview Assistant</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Plan Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white ${planColors[user?.plan || 'free']}`}>
              {user?.plan === 'pro' || user?.plan === 'enterprise' ? <Crown className="w-3 h-3" /> : null}
              <span className="capitalize">{user?.plan || 'Free'} Plan</span>
            </div>

            {/* User Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-dark rounded-lg border border-border hover:border-primary transition-colors">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">{user?.name || 'User'}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-lg border border-border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-3 border-b border-border">
                  <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  {user?.referralCode && (
                    <p className="text-xs text-primary mt-1">Code: {user.referralCode}</p>
                  )}
                </div>
                <div className="p-2">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-dark rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}