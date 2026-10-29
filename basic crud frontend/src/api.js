// Empty locally (Vite proxies /api); set VITE_API_URL to the backend URL in production
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const BASE_URL = `${API_URL}/api/items`

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`)
  // A non-JSON 200 usually means /api isn't reaching the backend
  if (data === null) throw new Error('Unexpected response from API')
  return data
}

export const getItems = () => request(BASE_URL)

export const createItem = (item) =>
  request(BASE_URL, { method: 'POST', body: JSON.stringify(item) })

export const updateItem = (id, item) =>
  request(`${BASE_URL}/${id}`, { method: 'PUT', body: JSON.stringify(item) })

export const deleteItem = (id) =>
  request(`${BASE_URL}/${id}`, { method: 'DELETE' })
