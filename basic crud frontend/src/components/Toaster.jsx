import { useEffect, useState } from 'react'
import { subscribe } from '../lib/toast'

const SHOW_MS = 3500

const STYLES = {
  success: { bar: 'bg-emerald-500', icon: 'bg-emerald-100 text-emerald-600', path: 'M5 13l4 4L19 7' },
  error: { bar: 'bg-red-500', icon: 'bg-red-100 text-red-600', path: 'M6 18L18 6M6 6l12 12' },
}

// Messages in the top-right corner that disappear by themselves
export default function Toaster() {
  const [items, setItems] = useState([])

  useEffect(
    () =>
      subscribe((item) => {
        setItems((prev) => [...prev, item])
        setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== item.id)), SHOW_MS)
      }),
    [],
  )

  const dismiss = (id) => setItems((prev) => prev.filter((x) => x.id !== id))

  return (
    <div className="pointer-events-none fixed top-4 right-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto print:hidden">
      {items.map((item) => {
        const style = STYLES[item.type]
        return (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-slate-200"
          >
            <div className={`w-1.5 shrink-0 ${style.bar}`} />
            <div className="flex flex-1 items-start gap-3 px-4 py-3">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
                </svg>
              </span>
              <p className="flex-1 text-sm text-slate-700">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
