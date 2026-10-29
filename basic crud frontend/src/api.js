const BASE_URL = '/api/items'

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`)
  return data
}

export const getItems = () => request(BASE_URL)

export const createItem = (item) =>
  request(BASE_URL, { method: 'POST', body: JSON.stringify(item) })

export const updateItem = (id, item) =>
  request(`${BASE_URL}/${id}`, { method: 'PUT', body: JSON.stringify(item) })

export const deleteItem = (id) =>
  request(`${BASE_URL}/${id}`, { method: 'DELETE' })
