import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { clearLogin, getUser } from '../lib/auth'
import { canInstall, onInstallChange, promptInstall } from '../lib/install'
import { toast } from '../lib/toast'
import { ConfirmDialog } from './ui'

// Outline icons (24x24, stroke). One path string per icon.
const ICONS = {
  users: 'M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a4 4 0 100-8 4 4 0 000 8zM21 20v-2a4 4 0 00-3-3.87M16 2.13a4 4 0 010 7.75',
  book: 'M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14zM4 19.5A2.5 2.5 0 006.5 22H20v-5',
  archive: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
  truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  box: 'M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7L12 12l8.7-5M12 22V12',
  card: 'M1 4h22v16H1zM1 10h22',
  check: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
}

function Icon({ name, className = 'h-4.5 w-4.5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={ICONS[name]} />
    </svg>
  )
}

const SECTIONS = [
  {
    title: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: 'grid' }],
  },
  {
    title: 'Customers',
    items: [
      { to: '/customers', label: 'Customers List', icon: 'users' },
      { to: '/customers/ledger', label: 'Customer Record', icon: 'book' },
      { to: '/customers/archive', label: 'Customer Archive', icon: 'archive' },
    ],
  },
  {
    title: 'Suppliers',
    items: [
      { to: '/suppliers', label: 'Suppliers List', icon: 'truck' },
      { to: '/suppliers/ledger', label: 'Supplier Record', icon: 'book' },
      { to: '/suppliers/archive', label: 'Supplier Archive', icon: 'archive' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { to: '/orders', label: 'Bulk Orders', icon: 'box' },
      { to: '/orders/done', label: 'Bulk Done', icon: 'check' },
      { to: '/credit', label: 'Credit Sales', icon: 'card' },
      { to: '/credit/done', label: 'Credit Done', icon: 'check' },
    ],
  },
]

function Sidebar({ onNavigate }) {
  const navigate = useNavigate()
  const user = getUser()
  const [confirming, setConfirming] = useState(false)
  const [installable, setInstallable] = useState(canInstall)
  useEffect(() => onInstallChange(setInstallable), [])

  function logout() {
    clearLogin()
    toast.success('Logged out')
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg shadow-lg shadow-brand-600/30">🥛</div>
        <div>
          <div className="font-semibold text-white">crud</div>
          <div className="text-xs text-slate-400">Dairy management</div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{section.title}</div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive ? 'bg-white/10 font-medium text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute top-1.5 bottom-1.5 left-0 w-1 rounded-r bg-brand-500" />}
                      <Icon name={item.icon} className={`h-[18px] w-[18px] ${isActive ? 'text-brand-500' : ''}`} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        {installable && (
          <button
            type="button"
            onClick={promptInstall}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Icon name="download" className="h-4 w-4" />
            Install app
          </button>
        )}
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white uppercase">
            {(user?.username || 'A').charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{user?.username || 'Admin'}</div>
            <div className="text-xs text-slate-400 capitalize">{user?.role || 'admin'}</div>
          </div>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            title="Log out"
            aria-label="Log out"
            className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <Icon name="logout" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          tone="primary"
          title="Log out?"
          message="You will need your username and password to sign in again."
          confirmLabel="Log out"
          onConfirm={logout}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 lg:block print:hidden">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden print:hidden">
          <aside className="w-64">
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
          <button type="button" className="flex-1 bg-slate-900/50" aria-label="Close menu" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden print:hidden">
          <button type="button" onClick={() => setOpen(true)} className="rounded-md px-2 py-1 text-xl" aria-label="Open menu">
            ☰
          </button>
          <span className="font-semibold">crud</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
