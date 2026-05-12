import { SignIn, SignUp } from '@clerk/clerk-react'
import { useState } from 'react'
import { GraduationCap, Check, AlertCircle } from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState(null)

  // Check if Clerk key is configured
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const hasClerkKey = clerkKey && clerkKey !== 'pk_test_placeholder' && clerkKey.includes('pk_test_')

  if (!hasClerkKey) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">InterviewAce</h1>
            <p className="text-slate-400 mt-2">Your AI Interview Assistant</p>
          </div>

          {/* Error Message */}
          <div className="bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Configuration Required</h2>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Clerk authentication is not configured. Please add your Clerk publishable key to the environment variables.
            </p>
            <div className="bg-dark rounded-lg p-4 text-xs text-slate-500 font-mono">
              <p className="text-slate-400 mb-2">Add to your .env file:</p>
              <code>VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here</code>
            </div>
            <p className="text-slate-500 text-xs mt-4">
              Get your key from <a href="https://dashboard.clerk.com" target="_blank" className="text-primary hover:underline">dashboard.clerk.com</a> → API Keys
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">InterviewAce</h1>
          <p className="text-slate-400 mt-2">Your AI Interview Assistant</p>
        </div>

        {/* Clerk Auth Component */}
        <div className="bg-card rounded-2xl p-8 border border-border">
          {isLogin ? (
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              afterSignInUrl="/"
              appearance={{
                variables: {
                  colorPrimary: '#8b5cf6',
                  colorBackground: '#1e293b',
                  colorInputBackground: '#0f172a',
                  colorInputText: '#ffffff',
                  colorText: '#ffffff',
                  colorTextSecondary: '#94a3b8',
                  borderRadius: '8px'
                },
                elements: {
                  card: 'bg-transparent shadow-none',
                  headerTitle: 'text-white',
                  headerSubtitle: 'text-slate-400',
                  formButtonPrimary: 'bg-gradient-to-r from-primary to-secondary'
                }
              }}
            />
          ) : (
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              afterSignUpUrl="/"
              appearance={{
                variables: {
                  colorPrimary: '#8b5cf6',
                  colorBackground: '#1e293b',
                  colorInputBackground: '#0f172a',
                  colorInputText: '#ffffff',
                  colorText: '#ffffff',
                  colorTextSecondary: '#94a3b8',
                  borderRadius: '8px'
                },
                elements: {
                  card: 'bg-transparent shadow-none',
                  headerTitle: 'text-white',
                  headerSubtitle: 'text-slate-400',
                  formButtonPrimary: 'bg-gradient-to-r from-primary to-secondary'
                }
              }}
            />
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline ml-1 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6 space-y-3">
          {['10 minutes free every week', 'AI-powered interview answers', 'Resume matching', 'Works with all platforms'].map((benefit, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              {benefit}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
