import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './index.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Fallback if key is missing or invalid
if (!clerkPubKey || clerkPubKey === 'pk_test_placeholder') {
  console.error('Missing Clerk publishable key. Add VITE_CLERK_PUBLISHABLE_KEY to your environment.')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPubKey || 'pk_test_placeholder'}
      routerPush={(to) => window.history.pushState(null, '', to)}
      routerReplace={(to) => window.history.replaceState(null, '', to)}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
