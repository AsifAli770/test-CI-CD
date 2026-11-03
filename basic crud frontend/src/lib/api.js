import { clearLogin, getToken } from './auth'
import { toast } from './toast'

// Empty locally (Vite proxies /api); set VITE_API_URL to the backend URL in production
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${API_URL}/api${path}`, window.location.origin)
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  }

  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    // fetch only throws when the server can't be reached at all
    throw new Error(navigator.onLine ? 'Cannot reach the server. Please try again.' : 'You are offline. Check your internet connection.')
  }
  const data = await res.json().catch(() => null)

  // Token missing or expired: back to the login page
  if (res.status === 401 && path !== '/auth/login') {
    clearLogin()
    window.location.assign('/login')
  }
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`)
  // A non-JSON 200 usually means /api isn't reaching the backend
  if (data === null) throw new Error('Unexpected response from API')
  // Saves and deletes come back with a message from the server, e.g. "Order created"
  if (method !== 'GET' && data.message) toast.success(data.message)
  return data
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body: body || {} }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
