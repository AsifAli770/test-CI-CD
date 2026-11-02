import { useEffect, useState } from 'react'
import { formatMoney } from '../lib/format'

const BUTTON_STYLES = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/50',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:text-red-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-600/50',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-300',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  const sizes = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${sizes} ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
  )
}

const INPUT_CLASS =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:bg-slate-100'

export function Input({ className = '', ...props }) {
  return <input className={`${INPUT_CLASS} ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${INPUT_CLASS} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...props }) {
  return <textarea rows={3} className={`${INPUT_CLASS} ${className}`} {...props} />
}

// error: message shown in red under the input (and the input gets a red border)
export function Field({ label, hint, required, error, className = '', children }) {
  return (
    <label
      className={`block ${error ? '[&_input]:border-red-400 [&_input]:bg-red-50/40 [&_select]:border-red-400' : ''} ${className}`}
    >
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      )}
    </label>
  )
}

// Red message for errors that don't belong to a single input (e.g. the item list)
export function FieldError({ children }) {
  if (!children) return null
  return <p className="mt-2 text-xs font-medium text-red-600">{children}</p>
}

export function Card({ title, actions, className = '', children }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </header>
      )}
      {children}
    </section>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 print:mb-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
    </div>
  )
}

// Positive balance in red (money due), negative in green (paid in advance)
export function Balance({ amount, className = '' }) {
  const color = amount > 0 ? 'text-red-600' : amount < 0 ? 'text-emerald-600' : 'text-slate-500'
  return (
    <span className={`font-medium tabular-nums ${color} ${className}`}>
      {formatMoney(Math.abs(amount))}
      {amount < 0 && ' adv'}
    </span>
  )
}

export function Alert({ type = 'error', children, onClose }) {
  if (!children) return null
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-brand-100 bg-brand-50 text-brand-700',
  }
  return (
    <div className={`mb-4 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${styles[type]}`}>
      <div>{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} className="opacity-60 hover:opacity-100" aria-label="Close">
          ✕
        </button>
      )}
    </div>
  )
}

export function Loading({ text = 'Loading…' }) {
  return <div className="px-4 py-10 text-center text-sm text-slate-500">{text}</div>
}

export function Empty({ children }) {
  return <div className="px-4 py-10 text-center text-sm text-slate-500">{children}</div>
}

// Plain table wrapper that scrolls sideways on small screens
export function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  )
}

export const th = 'px-4 py-2.5 text-xs font-semibold tracking-wide text-slate-500 uppercase bg-slate-50 border-b border-slate-200'
export const td = 'px-4 py-2.5 border-b border-slate-100'

const TONES = {
  danger: {
    bar: 'bg-red-600',
    circle: 'bg-red-100 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 disabled:bg-red-400',
    icon: 'M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3',
  },
  primary: {
    bar: 'bg-brand-600',
    circle: 'bg-brand-100 text-brand-600',
    button: 'bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/50',
    icon: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  },
  success: {
    bar: 'bg-emerald-600',
    circle: 'bg-emerald-100 text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400',
    icon: 'M5 13l4 4L19 7',
  },
}

// "Are you sure?" dialog: red for deletes, green (tone="success") for confirmations,
// blue with a log-out icon (tone="primary") for logging out.
// onConfirm may be async; errors show inside the dialog.
export function ConfirmDialog({ title, message, confirmLabel = 'Delete', tone = 'danger', onConfirm, onClose }) {
  const style = TONES[tone]
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={onBackdrop(() => !busy && onClose())}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className={`h-1.5 ${style.bar}`} />
        <div className="p-6 text-center">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${style.circle}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
          {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            autoFocus
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-white ${style.button}`}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Pill-shaped radio buttons, e.g. Cash / Online
export function RadioGroup({ name, value, options, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            value === option.value
              ? 'border-brand-600 bg-brand-50 text-brand-700'
              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 accent-brand-600"
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

// True only when the press started on the dark backdrop itself, so dragging
// a text selection out of the dialog doesn't close it
const onBackdrop = (close) => (event) => {
  if (event.target === event.currentTarget) close()
}

export function Modal({ title, onClose, wide = false, children }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
      onMouseDown={onBackdrop(onClose)}
    >
      <div className={`w-full rounded-lg bg-white shadow-xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            ✕
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
