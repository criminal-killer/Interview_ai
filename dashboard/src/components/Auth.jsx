import { SignIn, SignUp } from '@clerk/clerk-react'
import { useState } from 'react'
import { GraduationCap, Check } from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)

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
              afterSignInUrl="/dashboard"
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
              afterSignUpUrl="/dashboard"
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
