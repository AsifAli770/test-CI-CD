import { Link } from 'react-router'
import { Alert, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { getUser } from '../lib/auth'
import { useFetch } from '../lib/hooks'

// Paths for the outline icons used on this page
const ICONS = {
  users: 'M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a4 4 0 100-8 4 4 0 000 8zM21 20v-2a4 4 0 00-3-3.87M16 2.13a4 4 0 010 7.75',
  truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  userPlus: 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6',
  book: 'M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14zM4 19.5A2.5 2.5 0 006.5 22H20v-5',
  box: 'M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7L12 12l8.7-5M12 22V12',
  card: 'M1 4h22v16H1zM1 10h22',
}

function Icon({ name, className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={ICONS[name]} />
    </svg>
  )
}

// "?new=1" opens the add form on the target page straight away
const QUICK_ACTIONS = [
  { to: '/customers?new=1', label: 'Add Customer', text: 'Name, mobile and milk rate', icon: 'userPlus', color: 'bg-brand-50 text-brand-600' },
  { to: '/suppliers?new=1', label: 'Add Supplier', text: 'Who you buy milk from', icon: 'userPlus', color: 'bg-violet-50 text-violet-600' },
  { to: '/customers/ledger', label: 'Customer Milk & Payment', text: 'Add milk given or payment received', icon: 'book', color: 'bg-emerald-50 text-emerald-600' },
  { to: '/suppliers/ledger', label: 'Supplier Milk & Payment', text: 'Add milk received or payment made', icon: 'book', color: 'bg-amber-50 text-amber-600' },
  { to: '/orders?new=1', label: 'New Bulk Order', text: 'Marriage, party or function', icon: 'box', color: 'bg-rose-50 text-rose-600' },
  { to: '/credit?new=1', label: 'New Credit Sale', text: 'Items taken now, paid later', icon: 'card', color: 'bg-cyan-50 text-cyan-600' },
]

function StatCard({ label, value, icon, to, gradient }) {
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${gradient}`}
    >
      <Icon name={icon} className="absolute -right-4 -bottom-4 h-32 w-32 opacity-15" />
      <div className="relative">
        <div className="text-sm font-medium text-white/80">{label}</div>
        <div className="mt-2 text-4xl font-bold tabular-nums">{value}</div>
        <div className="mt-4 text-sm text-white/80 group-hover:text-white">View list →</div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const user = getUser()
  const { data, error } = useFetch(() => api.get('/dashboard'), [])

  return (
    <>
      <PageHeader title={`Hello, ${user?.username || 'Admin'}`} subtitle="Here is your business at a glance" />
      {error && <Alert>{error.message}</Alert>}

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Customers"
          value={data ? data.customers : '…'}
          icon="users"
          to="/customers"
          gradient="bg-gradient-to-br from-brand-600 to-brand-700"
        />
        <StatCard
          label="Total Suppliers"
          value={data ? data.suppliers : '…'}
          icon="truck"
          to="/suppliers"
          gradient="bg-gradient-to-br from-violet-600 to-violet-700"
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold tracking-wider text-slate-500 uppercase">Quick actions</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
              <Icon name={action.icon} className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-slate-800">{action.label}</span>
              <span className="block text-sm text-slate-500">{action.text}</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}
