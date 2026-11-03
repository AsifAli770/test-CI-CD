// "Install app" support. Chrome/Edge (Android and desktop) fire
// beforeinstallprompt when the app can be installed; we keep the event so a
// button can show the install dialog later. iPhone uses Share > Add to Home Screen.
let deferred = null
const listeners = new Set()
const notify = () => listeners.forEach((listener) => listener(Boolean(deferred)))

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export const canInstall = () => Boolean(deferred)

export function onInstallChange(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function promptInstall() {
  if (!deferred) return
  deferred.prompt()
  await deferred.userChoice
  deferred = null
  notify()
}

// Register the service worker in production builds only, so the dev server
// never serves stale cached files
export function registerServiceWorker() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.error('Service worker failed:', err))
    })
  }
}
