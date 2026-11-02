import { useCallback, useState } from 'react'
import ItemRows from '../components/ItemRows'
import {
  Alert,
  Balance,
  Button,
  Card,
  ConfirmDialog,
  Empty,
  Field,
  FieldError,
  Input,
  Loading,
  Modal,
  PageHeader,
  RadioGroup,
  Table,
  td,
  th,
} from '../components/ui'
import { api } from '../lib/api'
import { formatDate, formatMoney, formatQty, todayStr } from '../lib/format'
import { useFetch, useOpenOnNew } from '../lib/hooks'
import { initialItemRows, itemsBody, itemsTotal } from '../lib/items'
import { checkItems, checks, useErrors } from '../lib/validate'

const balanceOf = (order) => Math.round((order.total - order.totalPaid) * 100) / 100
const paymentsSum = (order) => (order.payments || []).reduce((sum, p) => sum + p.amount, 0)

const formatDay = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

// Bulk orders for marriages, parties and functions.
// done=false: open orders (Bulk Orders). done=true: finished orders (Bulk Done),
// which are the only ones that can be deleted.
export default function Orders({ done = false }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  useOpenOnNew(useCallback(() => setEditing({}), []))
  const [paying, setPaying] = useState(null)
  const [previewId, setPreviewId] = useState(null)
  const [finishing, setFinishing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)
  const { data: orders, error: loadError, loading, reload } = useFetch(
    () => api.get('/orders', { status: done ? 'done' : 'open' }),
    [done],
  )

  const term = search.trim().toLowerCase()
  const visible = (orders || []).filter(
    (order) => !term || order.name.toLowerCase().includes(term) || (order.mobile || '').includes(term),
  )
  const pending = (orders || []).reduce((sum, order) => sum + Math.max(balanceOf(order), 0), 0)
  // Preview reads from the list so it updates after a payment
  const previewing = previewId && orders?.find((order) => order._id === previewId)

  async function reopen(order) {
    setError(null)
    try {
      await api.post(`/orders/${order._id}/reopen`)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <PageHeader
        title={done ? 'Bulk Done' : 'Bulk Orders'}
        subtitle={
          orders
            ? done
              ? `${orders.length} finished orders`
              : `${orders.length} open orders · balance due ${formatMoney(pending)}`
            : ''
        }
        actions={!done && <Button onClick={() => setEditing({})}>+ New Order</Button>}
      />
      <Alert onClose={() => setError(null)}>{error}</Alert>
      <Card>
        <div className="border-b border-slate-200 p-4">
          <Input className="max-w-xs" placeholder="Search name or mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loadError && <div className="p-4"><Alert>{loadError.message}</Alert></div>}
        {loading && !orders ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty>{done ? 'No finished orders yet.' : 'No open orders.'}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>Date</th>
                <th className={th}>Name</th>
                <th className={th}>Mobile</th>
                <th className={th}>Items</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={`${th} text-right`}>Paid</th>
                <th className={`${th} text-right`}>Balance</th>
                {done && <th className={th}>Done on</th>}
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => {
                const balance = balanceOf(order)
                return (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className={`${td} whitespace-nowrap`}>{formatDate(order.date)}</td>
                    <td className={`${td} font-medium`}>{order.name}</td>
                    <td className={td}>{order.mobile || '-'}</td>
                    <td className={`${td} text-xs text-slate-600`}>
                      {order.items.map((item) => `${item.name} ${formatQty(item.quantity)}`).join(', ')}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{formatMoney(order.total)}</td>
                    <td className={`${td} text-right tabular-nums`}>{formatMoney(order.totalPaid)}</td>
                    <td className={`${td} text-right`}>
                      {balance > 0 ? (
                        <Balance amount={balance} />
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Paid</span>
                      )}
                    </td>
                    {done && <td className={`${td} whitespace-nowrap`}>{formatDay(order.doneAt)}</td>}
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <Button size="sm" variant="ghost" onClick={() => setPreviewId(order._id)} aria-label="Preview order" title="Preview">
                        <EyeIcon />
                      </Button>{' '}
                      {done ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => reopen(order)}>
                            Reopen
                          </Button>{' '}
                          <Button size="sm" variant="danger" onClick={() => setDeleting(order)}>
                            Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          {balance > 0 && (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => setPaying(order)}>
                                Payment received
                              </Button>{' '}
                            </>
                          )}
                          <Button size="sm" variant="secondary" onClick={() => setEditing(order)}>
                            Edit
                          </Button>{' '}
                          <Button size="sm" variant="success" onClick={() => setFinishing(order)}>
                            ✓ Done
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {editing && (
        <Modal wide title={editing._id ? `Edit order · ${editing.name}` : 'New Order'} onClose={() => setEditing(null)}>
          <OrderForm
            order={editing}
            onDone={() => {
              setEditing(null)
              reload()
            }}
          />
        </Modal>
      )}

      {paying && (
        <Modal title={`Payment received · ${paying.name}`} onClose={() => setPaying(null)}>
          <PaymentForm
            order={paying}
            onDone={() => {
              setPaying(null)
              reload()
            }}
          />
        </Modal>
      )}

      {previewing && (
        <Modal wide title="Order preview" onClose={() => setPreviewId(null)}>
          <OrderPreview
            order={previewing}
            done={done}
            onChange={reload}
            onPay={() => {
              setPreviewId(null)
              setPaying(previewing)
            }}
            onEdit={() => {
              setPreviewId(null)
              setEditing(previewing)
            }}
          />
        </Modal>
      )}

      {finishing && (
        <ConfirmDialog
          tone="success"
          title={`Mark ${finishing.name}'s order as done?`}
          message={
            balanceOf(finishing) > 0
              ? `${formatMoney(balanceOf(finishing))} is still unpaid. The order moves to Bulk Done.`
              : 'The order moves to Bulk Done.'
          }
          confirmLabel="Mark done"
          onConfirm={async () => {
            await api.post(`/orders/${finishing._id}/done`)
            reload()
          }}
          onClose={() => setFinishing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this order permanently?"
          message={`${deleting.name} · ${formatDate(deleting.date)} · ${formatMoney(deleting.total)}. This cannot be undone.`}
          confirmLabel="Delete permanently"
          onConfirm={async () => {
            await api.delete(`/orders/${deleting._id}`)
            reload()
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

function PaymentForm({ order, onDone }) {
  const [form, setForm] = useState({ date: todayStr(), amount: String(balanceOf(order)), method: 'cash' })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const { errors, validate, clear } = useErrors()

  async function submit(event) {
    event.preventDefault()
    const valid = validate({
      date: [form.date, checks.required('Date')],
      amount: [form.amount, checks.payment(balanceOf(order))],
    })
    if (!valid) return
    setError(null)
    setSaving(true)
    try {
      await api.post(`/orders/${order._id}/payments`, form)
      onDone()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-2 gap-4">
      <div className="col-span-2 empty:hidden">
        <Alert onClose={() => setError(null)}>{error}</Alert>
      </div>
      <Field label="Date" required error={errors.date}>
        <Input
          type="date"
          value={form.date}
          onChange={(e) => {
            setForm({ ...form, date: e.target.value })
            clear('date')
          }}
        />
      </Field>
      <Field label="Amount (₹)" required error={errors.amount}>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={(e) => {
            setForm({ ...form, amount: e.target.value })
            clear('amount')
          }}
          autoFocus
        />
      </Field>
      <div className="col-span-2">
        <span className="mb-1 block text-sm font-medium text-slate-700">Paid by</span>
        <RadioGroup
          name="method"
          value={form.method}
          onChange={(method) => setForm({ ...form, method })}
          options={[
            { value: 'cash', label: 'Cash' },
            { value: 'online', label: 'Online' },
          ]}
        />
      </div>
      <div className="col-span-2 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          Balance: <Balance amount={balanceOf(order)} />
        </span>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save payment'}
        </Button>
      </div>
    </form>
  )
}

// Read-only, bill-style view of an order with its payments
function OrderPreview({ order, done, onChange, onPay, onEdit }) {
  const [deleting, setDeleting] = useState(null)
  const balance = balanceOf(order)

  return (
    <div className="print-area space-y-5">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-slate-900">{order.name}</div>
          <div className="text-sm text-slate-500">{order.mobile || 'No mobile number'}</div>
        </div>
        <div className="text-right text-sm">
          <div className="text-slate-500">Delivery date</div>
          <div className="font-medium">{formatDate(order.date)}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <Table>
          <thead>
            <tr>
              <th className={th}>Item</th>
              <th className={`${th} text-right`}>Quantity</th>
              <th className={`${th} text-right`}>Rate</th>
              <th className={`${th} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.name}>
                <td className={`${td} font-medium`}>{item.name}</td>
                <td className={`${td} text-right tabular-nums`}>{formatQty(item.quantity)}</td>
                <td className={`${td} text-right tabular-nums`}>{formatMoney(item.rate)}</td>
                <td className={`${td} text-right tabular-nums`}>{formatMoney(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-sm">
            <tr className="bg-slate-50 font-semibold">
              <td className={td} colSpan={3}>
                Total
              </td>
              <td className={`${td} text-right tabular-nums`}>{formatMoney(order.total)}</td>
            </tr>
            <tr>
              <td className={td} colSpan={3}>
                Advance
              </td>
              <td className={`${td} text-right tabular-nums`}>{formatMoney(order.paid)}</td>
            </tr>
            {order.payments.map((p) => (
              <tr key={p._id}>
                <td className={td} colSpan={3}>
                  Payment · {formatDate(p.date)}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.method === 'online' ? 'bg-brand-50 text-brand-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {p.method === 'online' ? 'Online' : 'Cash'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleting(p)}
                    className="ml-2 text-slate-400 hover:text-red-600 print:hidden"
                    aria-label="Delete payment"
                  >
                    ✕
                  </button>
                </td>
                <td className={`${td} text-right tabular-nums`}>{formatMoney(p.amount)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className={td} colSpan={3}>
                Balance
              </td>
              <td className={`${td} text-right`}>
                {balance > 0 ? <Balance amount={balance} /> : <span className="text-emerald-600">Fully paid</span>}
              </td>
            </tr>
          </tfoot>
        </Table>
      </div>

      {order.note && (
        <div className="rounded-md bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">Note: </span>
          {order.note}
        </div>
      )}

      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
        {!done && balance > 0 && (
          <Button variant="secondary" onClick={onPay}>
            Payment received
          </Button>
        )}
        {!done && <Button onClick={onEdit}>Edit order</Button>}
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete this payment?"
          message={`${formatDate(deleting.date)} · ${formatMoney(deleting.amount)}`}
          onConfirm={async () => {
            await api.delete(`/orders/${order._id}/payments/${deleting._id}`)
            onChange()
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function OrderForm({ order, onDone }) {
  const [form, setForm] = useState({
    name: order.name || '',
    mobile: order.mobile || '',
    date: order.date || todayStr(),
    paid: order.paid ? String(order.paid) : '',
    note: order.note || '',
  })
  const [rows, setRows] = useState(() => initialItemRows(order.items))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const { errors, validate, clear } = useErrors()
  const set = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value })
    clear(field)
  }
  const updateRows = (next) => {
    setRows(next)
    clear('items')
  }

  const total = itemsTotal(rows)
  const balance = total - Number(form.paid || 0) - paymentsSum(order)

  async function submit(event) {
    event.preventDefault()
    const valid = validate({
      name: [form.name, checks.name()],
      mobile: [form.mobile, checks.mobile()],
      date: [form.date, checks.required('Date')],
      items: [rows, checkItems],
      paid: [form.paid, checks.notNegative('Advance')],
    })
    if (!valid) return
    setError(null)
    setSaving(true)
    try {
      const body = { ...form, items: itemsBody(rows) }
      if (order._id) await api.patch(`/orders/${order._id}`, body)
      else await api.post('/orders', body)
      onDone()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Alert onClose={() => setError(null)}>{error}</Alert>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Name" required error={errors.name}>
          <Input value={form.name} onChange={set('name')} autoFocus maxLength={100} />
        </Field>
        <Field label="Mobile number" error={errors.mobile}>
          <Input value={form.mobile} onChange={set('mobile')} inputMode="numeric" maxLength={10} placeholder="10 digits" />
        </Field>
        <Field label="Delivery date" required error={errors.date}>
          <Input type="date" value={form.date} onChange={set('date')} />
        </Field>
      </div>

      <div>
        <ItemRows rows={rows} setRows={updateRows} />
        <FieldError>{errors.items}</FieldError>
      </div>

      <div className="grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3">
        <Field label="Advance (₹)" error={errors.paid} hint={paymentsSum(order) ? `Plus ${formatMoney(paymentsSum(order))} in later payments` : undefined}>
          <Input type="number" step="0.01" min="0" value={form.paid} onChange={set('paid')} placeholder="0" />
        </Field>
        <Field label="Note" className="sm:col-span-2">
          <Input value={form.note} onChange={set('note')} placeholder="Function, address…" maxLength={300} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 px-4 py-3">
        <div className="flex gap-6 text-sm">
          <span>
            Total: <b className="tabular-nums">{formatMoney(total)}</b>
          </span>
          <span>
            Balance: <Balance amount={balance} />
          </span>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save order'}
        </Button>
      </div>
    </form>
  )
}
