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

const balanceOf = (u) => Math.round((u.total - u.paid) * 100) / 100

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

// Items taken on credit; payments are added later until the balance is zero.
// done=false: still owed (Credit Sales). done=true: fully paid (Credit Done).
// A sale moves to Credit Done by itself once its balance reaches zero.
export default function Credit({ done = false }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  useOpenOnNew(useCallback(() => setEditing({}), []))
  const [paying, setPaying] = useState(null)
  const [previewId, setPreviewId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const { data: records, error, loading, reload } = useFetch(() => api.get('/credit'), [])

  const term = search.trim().toLowerCase()
  const inView = (records || []).filter((u) => (done ? balanceOf(u) <= 0 : balanceOf(u) > 0))
  const visible = inView.filter((u) => !term || u.name.toLowerCase().includes(term) || (u.mobile || '').includes(term))
  const pending = inView.reduce((sum, u) => sum + balanceOf(u), 0)
  const collected = inView.reduce((sum, u) => sum + u.paid, 0)
  // Preview reads from the list so it updates after a payment
  const previewing = previewId && records?.find((u) => u._id === previewId)

  return (
    <>
      <PageHeader
        title={done ? 'Credit Done' : 'Credit Sales'}
        subtitle={
          records
            ? done
              ? `${inView.length} fully paid · ${formatMoney(collected)} collected`
              : `${inView.length} unpaid · total pending ${formatMoney(pending)}`
            : ''
        }
        actions={!done && <Button onClick={() => setEditing({})}>+ New Credit Sale</Button>}
      />
      <Card>
        <div className="border-b border-slate-200 p-4">
          <Input className="max-w-xs" placeholder="Search name or mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {error && <div className="p-4"><Alert>{error.message}</Alert></div>}
        {loading && !records ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty>{done ? 'No fully paid credit sales yet.' : 'No pending credit sales.'}</Empty>
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
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const balance = balanceOf(u)
                return (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className={`${td} whitespace-nowrap`}>{formatDate(u.date)}</td>
                    <td className={`${td} font-medium`}>{u.name}</td>
                    <td className={td}>{u.mobile || '-'}</td>
                    <td className={`${td} text-xs text-slate-600`}>
                      {u.items.map((item) => `${item.name} ${formatQty(item.quantity)}`).join(', ')}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{formatMoney(u.total)}</td>
                    <td className={`${td} text-right tabular-nums`}>{formatMoney(u.paid)}</td>
                    <td className={`${td} text-right`}>
                      {balance > 0 ? (
                        <Balance amount={balance} />
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Paid</span>
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <Button size="sm" variant="ghost" onClick={() => setPreviewId(u._id)} aria-label="Preview" title="Preview">
                        <EyeIcon />
                      </Button>{' '}
                      {balance > 0 && (
                        <>
                          <Button size="sm" onClick={() => setPaying(u)}>
                            Payment
                          </Button>{' '}
                        </>
                      )}
                      {!done && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => setEditing(u)}>
                            Edit
                          </Button>{' '}
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setDeleting(u)} aria-label="Delete">
                        ✕
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {editing && (
        <Modal wide title={editing._id ? `Edit credit sale · ${editing.name}` : 'New Credit Sale'} onClose={() => setEditing(null)}>
          <CreditForm
            credit={editing}
            onDone={() => {
              setEditing(null)
              reload()
            }}
          />
        </Modal>
      )}

      {paying && (
        <Modal title={`Payment · ${paying.name}`} onClose={() => setPaying(null)}>
          <PaymentForm
            credit={paying}
            onDone={() => {
              setPaying(null)
              reload()
            }}
          />
        </Modal>
      )}

      {previewing && (
        <Modal wide title="Credit sale preview" onClose={() => setPreviewId(null)}>
          <CreditPreview credit={previewing} onChange={reload} 
            onPay={() => {
              setPreviewId(null)
              setPaying(previewing)
            }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this credit sale?"
          message={`${deleting.name} · ${formatDate(deleting.date)} · ${formatMoney(deleting.total)}`}
          onConfirm={async () => {
            await api.delete(`/credit/${deleting._id}`)
            reload()
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

function CreditForm({ credit, onDone }) {
  const [form, setForm] = useState({
    name: credit.name || '',
    mobile: credit.mobile || '',
    date: credit.date || todayStr(),
    note: credit.note || '',
  })
  const [rows, setRows] = useState(() => initialItemRows(credit.items))
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

  async function submit(event) {
    event.preventDefault()
    const valid = validate({
      name: [form.name, checks.name()],
      mobile: [form.mobile, checks.mobile()],
      date: [form.date, checks.required('Date')],
      items: [rows, checkItems],
    })
    if (!valid) return
    setError(null)
    setSaving(true)
    try {
      const body = { ...form, items: itemsBody(rows) }
      if (credit._id) await api.patch(`/credit/${credit._id}`, body)
      else await api.post('/credit', body)
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
        <Field label="Date" required error={errors.date}>
          <Input type="date" value={form.date} onChange={set('date')} />
        </Field>
      </div>

      <div>
        <ItemRows rows={rows} setRows={updateRows} />
        <FieldError>{errors.items}</FieldError>
      </div>

      <Field label="Note">
        <Input value={form.note} onChange={set('note')} maxLength={300} />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 px-4 py-3">
        <span className="text-sm">
          Total: <b className="tabular-nums">{formatMoney(total)}</b>
        </span>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save credit sale'}
        </Button>
      </div>
    </form>
  )
}

function PaymentForm({ credit, onDone }) {
  const [form, setForm] = useState({ date: todayStr(), amount: String(balanceOf(credit)), method: 'cash' })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const { errors, validate, clear } = useErrors()

  async function submit(event) {
    event.preventDefault()
    const valid = validate({
      date: [form.date, checks.required('Date')],
      amount: [form.amount, checks.payment(balanceOf(credit))],
    })
    if (!valid) return
    setError(null)
    setSaving(true)
    try {
      await api.post(`/credit/${credit._id}/payments`, form)
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
          Balance: <Balance amount={balanceOf(credit)} />
        </span>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save payment'}
        </Button>
      </div>
    </form>
  )
}

// Bill-style view with payment history
function CreditPreview({ credit, onChange, onPay }) {
  const [deleting, setDeleting] = useState(null)
  const balance = balanceOf(credit)

  return (
    <div className="print-area space-y-5">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-slate-900">{credit.name}</div>
          <div className="text-sm text-slate-500">{credit.mobile || 'No mobile number'}</div>
        </div>
        <div className="text-right text-sm">
          <div className="text-slate-500">Date</div>
          <div className="font-medium">{formatDate(credit.date)}</div>
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
            {credit.items.map((item) => (
              <tr key={item.name}>
                <td className={`${td} font-medium`}>{item.name}</td>
                <td className={`${td} text-right tabular-nums`}>{formatQty(item.quantity)}</td>
                <td className={`${td} text-right tabular-nums`}>{formatMoney(item.rate)}</td>
                <td className={`${td} text-right tabular-nums`}>{formatMoney(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold">
              <td className={td} colSpan={3}>
                Total
              </td>
              <td className={`${td} text-right tabular-nums`}>{formatMoney(credit.total)}</td>
            </tr>
          </tfoot>
        </Table>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Payments</h3>
        {credit.payments.length === 0 ? (
          <p className="text-sm text-slate-500">No payments yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <Table>
              <tbody>
                {credit.payments.map((p) => (
                  <tr key={p._id}>
                    <td className={td}>{formatDate(p.date)}</td>
                    <td className={td}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.method === 'online' ? 'bg-brand-50 text-brand-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {p.method === 'online' ? 'Online' : 'Cash'}
                      </span>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{formatMoney(p.amount)}</td>
                    <td className={`${td} w-10 text-right print:hidden`}>
                      <Button size="sm" variant="ghost" onClick={() => setDeleting(p)} aria-label="Delete payment">
                        ✕
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {credit.note && (
        <div className="rounded-md bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">Note: </span>
          {credit.note}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm">
        <div className="flex gap-6">
          <span>
            Paid: <b className="tabular-nums">{formatMoney(credit.paid)}</b>
          </span>
          <span>
            Balance: {balance > 0 ? <Balance amount={balance} /> : <b className="text-emerald-600">Fully paid</b>}
          </span>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
          {balance > 0 && <Button onClick={onPay}>Add payment</Button>}
        </div>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete this payment?"
          message={`${formatDate(deleting.date)} · ${formatMoney(deleting.amount)}`}
          onConfirm={async () => {
            await api.delete(`/credit/${credit._id}/payments/${deleting._id}`)
            onChange()
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
