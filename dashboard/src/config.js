// Centralized API config - prevents double slashes
const BASE_URL = (() => {
  let url = import.meta.env.VITE_API_URL || 'https://api-beta-three-38.vercel.app'
  // Remove trailing slash
  return url.replace(/\/$/, '')
})()

const API = {
  url: BASE_URL,
  endpoints: {
    profile: '/api/user/profile',
    resumes: '/api/resumes',
    jobs: '/api/jobs',
    sessions: '/api/sessions',
    sessionsActive: '/api/sessions/active',
    sessionsStart: '/api/sessions/start',
    sessionsEnd: '/api/sessions/end',
    sessionsMessage: '/api/sessions/message',
    aiAnswer: '/api/ai/answer',
    billing: '/api/billing/create-checkout',
    referrals: '/api/referrals',
    adminStats: '/api/admin/stats',
    adminUsers: '/api/admin/users',
    adminPayouts: '/api/admin/payouts',
    adminPayout: '/api/admin/payout',
  }
}

export { API, BASE_URL as API_URL }