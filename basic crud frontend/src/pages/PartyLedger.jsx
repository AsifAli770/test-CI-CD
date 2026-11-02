import { Fragment, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Alert, Balance, Button, Card, ConfirmDialog, Empty, Field, Input, Loading, Modal, PageHeader, RadioGroup, Table, td, th } from '../components/ui'
import { api } from '../lib/api'
import { formatDate, formatMoney, formatQty, todayStr } from '../lib/format'
import { useFetch } from '../lib/hooks'
import { checks, useErrors } from '../lib/validate'

// Everyone in one list. Click a row to open their ledger, click again to close.
// Add milk / payment from the buttons on each row.
export default function PartyLedger({ config }) {
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(params.get('id'))
  const [modal, setModal] = useState(null) // { kind: 'milk' | 'payment', party }
  // Bumped after any change so the open ledger reloads too
  const [version, setVersion] = useState(0)
  const { data: parties, error, loading } = useFetch(() => api.get(config.api), [config.api, version])

  const term = search.trim().toLowerCase()
  const visible = (parties || []).filter(
    (party) => !term || party.name.toLowerCase().includes(term) || (party.mobile || '').includes(term),
  )
  const totalBalance = (parties || []).reduce((sum, party) => sum + party.balance, 0)

  function changed(partyId) {
    setVersion((v) => v + 1)
    if (partyId) setOpenId(partyId)
  }

  function openModal(event, kind, party) {
    event.stopPropagation()
    setModal({ kind, party })
  }

  return (
    <>
      <PageHeader
        title={`${config.label} Ledger`}
        subtitle={parties ? `${parties.length} ${config.plural.toLowerCase()} · total ${config.balanceLabel.toLowerCase()} ${formatMoney(totalBalance)}` : ''}
      />
      <Card>
        <div className="border-b border-slate-200 p-4 print:hidden">
          <Input
            className="max-w-sm"
            placeholder={`Search ${config.label.toLowerCase()} by name or mobile`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {error && <div className="p-4"><Alert>{error.message}</Alert></div>}
        {loading && !parties ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty>No {config.plural.toLowerCase()} found.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={`${th} w-8`}></th>
                <th className={th}>Name</th>
                <th className={th}>Mobile</th>
                <th className={`${th} text-right`}>Milk rate</th>
                <th className={`${th} text-right`}>{config.balanceLabel}</th>
                <th className={`${th} print:hidden`}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((party) => {
                const isOpen = openId === party._id
                return (
                  <Fragment key={party._id}>
                    <tr
                      onClick={() => setOpenId(isOpen ? null : party._id)}
                      className={`cursor-pointer ${isOpen ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className={`${td} text-slate-400`}>{isOpen ? '▾' : '▸'}</td>
                      <td className={`${td} font-medium`}>{party.name}</td>
                      <td className={td}>{party.mobile || '-'}</td>
                      <td className={`${td} text-right tabular-nums`}>{formatMoney(party.rate)}/kg</td>
                      <td className={`${td} text-right`}>
                        <Balance amount={party.balance} />
                      </td>
                      <td className={`${td} whitespace-nowrap text-right print:hidden`}>
                        <Button size="sm" onClick={(e) => openModal(e, 'milk', party)}>
                          + Add milk
                        </Button>{' '}
                        <Button size="sm" variant="secondary" onClick={(e) => openModal(e, 'payment', party)}>
                          {config.paymentLabel}
                        </Button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={6} className="border-b border-slate-200 bg-slate-50 p-3">
                          <LedgerDetail id={party._id} config={config} version={version} onChange={() => changed()} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {modal && (
        <Modal
          title={`${modal.kind === 'milk' ? config.milkLabel : config.paymentLabel} · ${modal.party.name}`}
          onClose={() => setModal(null)}
        >
          {(() => {
            const Form = modal.kind === 'milk' ? MilkForm : PaymentForm
            return (
              <Form
                config={config}
                party={modal.party}
                onDone={() => {
                  setModal(null)
                  changed(modal.party._id)
                }}
              />
            )
          })()}
        </Modal>
      )}
    </>
  )
}

// One person's entries with running balance
function LedgerDetail({ id, config, version, onChange }) {
  const [range, setRange] = useState({ from: '', to: '' })
  const [deleting, setDeleting] = useState(null)
  const { data, error: loadError, loading } = useFetch(
    () => api.get(`${config.api}/${id}/ledger`, range),
    [id, range.from, range.to, version],
  )

  if (loading && !data) return <Loading />
  if (loadError) return <Alert>{loadError.message}</Alert>

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {deleting && (
        <ConfirmDialog
          title="Delete this entry?"
          message={`${formatDate(deleting.date)} · ${entryDetails(deleting)} · ${formatMoney(deleting.amount)}`}
          onConfirm={async () => {
            await api.delete(`${config.api}/${id}/entries/${deleting._id}`)
            onChange()
          }}
          onClose={() => setDeleting(null)}
        />
      )}
      <div className="flex flex-wrap items-end gap-3 px-4 py-3 print:hidden">
        <Field label="From">
          <Input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        </Field>
        <Field label="To">
          <Input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </Field>
        {(range.from || range.to) && (
          <Button variant="ghost" onClick={() => setRange({ from: '', to: '' })}>
            Clear
          </Button>
        )}
        <Button variant="secondary" className="ml-auto" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      {data.rows.length === 0 && !data.opening ? (
        <Empty>No entries yet. Use “Add milk” or “{config.paymentLabel}”.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th className={th}>Date</th>
              <th className={th}>Details</th>
              <th className={`${th} text-right`}>{config.milkLabel}</th>
              <th className={`${th} text-right`}>{config.paymentLabel}</th>
              <th className={`${th} text-right`}>Balance</th>
              <th className={`${th} print:hidden`}></th>
            </tr>
          </thead>
          <tbody>
            {range.from && (
              <tr className="bg-slate-50">
                <td className={td}>{formatDate(range.from)}</td>
                <td className={`${td} font-medium`} colSpan={3}>
                  Previous balance
                </td>
                <td className={`${td} text-right`}>
                  <Balance amount={data.opening} />
                </td>
                <td className={`${td} print:hidden`}></td>
              </tr>
            )}
            {data.rows.map((entry) => (
              <tr key={entry._id}>
                <td className={`${td} whitespace-nowrap`}>{formatDate(entry.date)}</td>
                <td className={td}>
                  {entry.kind === 'milk' ? (
                    `Milk ${formatQty(entry.quantity)} × ${formatMoney(entry.rate)}`
                  ) : (
                    <>
                      Payment
                      {entry.method && (
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                            entry.method === 'online' ? 'bg-brand-50 text-brand-700' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {entry.method === 'online' ? 'Online' : 'Cash'}
                        </span>
                      )}
                    </>
                  )}
                  {entry.note && <span className="ml-2 text-slate-500">{entry.note}</span>}
                </td>
                <td className={`${td} text-right tabular-nums`}>{entry.kind !== 'payment' ? formatMoney(entry.amount) : '-'}</td>
                <td className={`${td} text-right tabular-nums`}>{entry.kind === 'payment' ? formatMoney(entry.amount) : '-'}</td>
                <td className={`${td} text-right`}>
                  <Balance amount={entry.balance} />
                </td>
                <td className={`${td} text-right print:hidden`}>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(entry)} aria-label="Delete entry">
                    ✕
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold">
              <td className={td}>Total</td>
              <td className={td}>{formatQty(data.totalQuantity)}</td>
              <td className={`${td} text-right tabular-nums`}>{formatMoney(data.totalMilk)}</td>
              <td className={`${td} text-right tabular-nums`}>{formatMoney(data.totalPaid)}</td>
              <td className={`${td} text-right`}>
                <Balance amount={data.closing} />
              </td>
              <td className={`${td} print:hidden`}></td>
            </tr>
          </tfoot>
        </Table>
      )}
    </div>
  )
}

// Short text for a ledger line: "Milk 2 kg × ₹75" or "Payment"
function entryDetails(entry) {
  return entry.kind === 'milk' ? `Milk ${formatQty(entry.quantity)} × ${formatMoney(entry.rate)}` : 'Payment'
}

// Shared submit logic for the modal forms
function useEntryForm(config, party, initial, onDone) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const { errors, validate, clear } = useErrors()
  const set = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value })
    clear(field)
  }

  // rules: { field: [value, ...checks] } - checked before anything is sent
  async function submit(event, body, rules) {
    event.preventDefault()
    if (!validate(rules)) return
    setSaving(true)
    setError(null)
    try {
      await api.post(`${config.api}/${party._id}/entries`, body)
      onDone()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return { form, setForm, set, error, setError, errors, saving, submit }
}

function MilkForm({ config, party, onDone }) {
  const { form, set, error, setError, errors, saving, submit } = useEntryForm(
    config,
    party,
    { date: todayStr(), quantity: '', rate: String(party.rate), note: '' },
    onDone,
  )
  const amount = Math.round(Number(form.quantity || 0) * Number(form.rate || 0) * 100) / 100

  return (
    <form
      noValidate
      onSubmit={(e) =>
        submit(e, { kind: 'milk', ...form }, {
          date: [form.date, checks.required('Date')],
          quantity: [form.quantity, checks.positive('Quantity')],
          rate: [form.rate, checks.requiredNotNegative('Rate')],
        })
      }
      className="grid grid-cols-2 gap-4"
    >
      <div className="col-span-2 empty:hidden">
        <Alert onClose={() => setError(null)}>{error}</Alert>
      </div>
      <Field label="Date" required error={errors.date}>
        <Input type="date" value={form.date} onChange={set('date')} />
      </Field>
      <Field label="Quantity (kg)" required error={errors.quantity}>
        <Input type="number" step="0.001" min="0" value={form.quantity} onChange={set('quantity')} autoFocus />
      </Field>
      <Field label="Rate (₹/kg)" required error={errors.rate}>
        <Input type="number" step="0.01" min="0" value={form.rate} onChange={set('rate')} />
      </Field>
      <Field label="Note">
        <Input value={form.note} onChange={set('note')} maxLength={200} />
      </Field>
      <div className="col-span-2 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          Amount: <b className="text-slate-800">{formatMoney(amount)}</b>
        </span>
        <Button type="submit" disabled={saving}>
          {saving ? 'Adding…' : 'Add milk'}
        </Button>
      </div>
    </form>
  )
}

function PaymentForm({ config, party, onDone }) {
  const { form, setForm, set, error, setError, errors, saving, submit } = useEntryForm(
    config,
    party,
    { date: todayStr(), amount: '', method: 'cash' },
    onDone,
  )

  return (
    <form
      noValidate
      onSubmit={(e) =>
        submit(e, { kind: 'payment', ...form }, {
          date: [form.date, checks.required('Date')],
          amount: [form.amount, checks.positive('Amount')],
        })
      }
      className="grid grid-cols-2 gap-4"
    >
      <div className="col-span-2 empty:hidden">
        <Alert onClose={() => setError(null)}>{error}</Alert>
      </div>
      <Field label="Date" required error={errors.date}>
        <Input type="date" value={form.date} onChange={set('date')} />
      </Field>
      <Field label="Amount (₹)" required error={errors.amount}>
        <Input type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} autoFocus />
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
          {config.balanceLabel}: <Balance amount={party.balance} />
        </span>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : `Save ${config.paymentLabel.toLowerCase()}`}
        </Button>
      </div>
    </form>
  )
}
