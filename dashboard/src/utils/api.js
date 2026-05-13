// API utility - ensures no double slashes
export const getApiUrl = () => {
  let baseUrl = import.meta.env.VITE_API_URL || 'https://api-beta-three-38.vercel.app'
  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/$/, '')
  return baseUrl
}

// Fetch wrapper with auth
export const apiFetch = async (endpoint, options = {}) => {
  const baseUrl = getApiUrl()
  // Remove leading slash from endpoint if present
  const path = endpoint.replace(/^\//, '')
  const url = `${baseUrl}/${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  return response
}