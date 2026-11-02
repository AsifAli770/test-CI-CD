import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { Alert, Balance, Button, Card, ConfirmDialog, Empty, Field, Input, Loading, Modal, PageHeader, Table, td, th } from '../components/ui'
import { api } from '../lib/api'
import { formatMoney } from '../lib/format'
import { useFetch, useOpenOnNew } from '../lib/hooks'
import { checks, useErrors } from '../lib/validate'

// Customers or suppliers: name, mobile, milk rate and current balance
export default function PartyList({ config }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  useOpenOnNew(useCallback(() => setEditing({}), []))
  const [deleting, setDeleting] = useState(null)
  const { data: parties, error: loadError, loading, reload } = useFetch(() => api.get(config.api), [config.api])

  const term = search.trim().toLowerCase()
  const visible = (parties || []).filter(
    (party) => !term || party.name.toLowerCase().includes(term) || (party.mobile || '').includes(term),
  )

  return (
    <>
      <PageHeader
        title={config.plural}
        subtitle={parties ? `${parties.length} total` : ''}
        actions={<Button onClick={() => setEditing({})}>+ Add {config.label}</Button>}
      />
      <Card>
        <div className="border-b border-slate-200 p-4">
          <Input className="max-w-xs" placeholder="Search name or mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loadError && <div className="p-4"><Alert>{loadError.message}</Alert></div>}
        {loading && !parties ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty>No {config.plural.toLowerCase()} found.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Mobile</th>
                <th className={`${th} text-right`}>Milk rate</th>
                <th className={`${th} text-right`}>{config.balanceLabel}</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((party) => (
                <tr key={party._id} className="hover:bg-slate-50">
                  <td className={`${td} font-medium`}>{party.name}</td>
                  <td className={td}>{party.mobile || '-'}</td>
                  <td className={`${td} text-right tabular-nums`}>{formatMoney(party.rate)}/kg</td>
                  <td className={`${td} text-right`}>
                    <Balance amount={party.balance} />
                  </td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <Link
                      to={`${config.path}/ledger?id=${party._id}`}
                      className="mr-2 rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                    >
                      Ledger
                    </Link>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(party)}>
                      Edit
                    </Button>{' '}
                    <Button size="sm" variant="danger" onClick={() => setDeleting(party)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          message={`This ${config.label.toLowerCase()} moves to the ${config.label} Archive. You can restore them within 30 days; after that they are deleted permanently.`}
          onConfirm={async () => {
            await api.delete(`${config.api}/${deleting._id}`)
            reload()
          }}
          onClose={() => setDeleting(null)}
        />
      )}

      {editing && (
        <PartyForm
          config={config}
          party={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </>
  )
}

function PartyForm({ config, party, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: party.name || '',
    mobile: party.mobile || '',
    rate: party.rate ?? '',
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const { errors, validate, clear } = useErrors()
  const set = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value })
    clear(field)
  }

  async function submit(event) {
    event.preventDefault()
    const valid = validate({
      name: [form.name, checks.name()],
      mobile: [form.mobile, checks.mobile()],
      rate: [form.rate, checks.requiredNotNegative('Milk rate')],
    })
    if (!valid) return
    setSaving(true)
    try {
      const body = { ...form, rate: Number(form.rate) }
      if (party._id) await api.patch(`${config.api}/${party._id}`, body)
      else await api.post(config.api, body)
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={party._id ? `Edit ${party.name}` : `Add ${config.label}`} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Alert onClose={() => setError(null)}>{error}</Alert>
        <Field label="Name" required error={errors.name}>
          <Input value={form.name} onChange={set('name')} autoFocus maxLength={100} />
        </Field>
        <Field label="Mobile number" error={errors.mobile}>
          <Input value={form.mobile} onChange={set('mobile')} inputMode="numeric" maxLength={10} placeholder="10 digits" />
        </Field>
        <Field
          label="Milk rate (₹ per kg)"
          required
          error={errors.rate}
          hint={party._id ? 'A new rate applies to new entries only' : undefined}
        >
          <Input type="number" step="0.01" min="0" value={form.rate} onChange={set('rate')} />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
