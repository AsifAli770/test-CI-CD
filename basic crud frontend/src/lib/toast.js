// Tiny toast store: call toast.success("...") from anywhere; <Toaster /> shows them
const listeners = new Set()
let nextId = 1

function show(type, message) {
  if (!message) return
  const item = { id: nextId++, type, message }
  listeners.forEach((listener) => listener(item))
}

export const toast = {
  success: (message) => show('success', message),
  error: (message) => show('error', message),
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
