import { useState } from 'react'
import { Alert, Balance, Button, Card, ConfirmDialog, Empty, Loading, PageHeader, Table, td, th } from '../components/ui'
import { api } from '../lib/api'
import { formatMoney } from '../lib/format'
import { useFetch } from '../lib/hooks'

const formatDay = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

// Deleted customers/suppliers. They can be restored for 30 days, then the
// server removes them (and their ledger) permanently.
export default function PartyArchive({ config }) {
  const [error, setError] = useState(null)
  const [destroying, setDestroying] = useState(null)
  const { data: parties, error: loadError, loading, reload } = useFetch(() => api.get(`${config.api}/archive`), [config.api])

  async function restore(party) {
    setError(null)
    try {
      await api.post(`${config.api}/${party._id}/restore`)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <PageHeader
        title={`${config.label} Archive`}
        subtitle="Deleted records stay here for 30 days, then they are removed permanently with their ledger."
      />
      <Alert onClose={() => setError(null)}>{error}</Alert>
      <Card>
        {loadError && <div className="p-4"><Alert>{loadError.message}</Alert></div>}
        {loading && !parties ? (
          <Loading />
        ) : parties?.length === 0 ? (
          <Empty>The archive is empty.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Mobile</th>
                <th className={`${th} text-right`}>Milk rate</th>
                <th className={`${th} text-right`}>{config.balanceLabel}</th>
                <th className={th}>Deleted on</th>
                <th className={th}>Removed in</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {parties.map((party) => (
                <tr key={party._id} className="hover:bg-slate-50">
                  <td className={`${td} font-medium`}>{party.name}</td>
                  <td className={td}>{party.mobile || '-'}</td>
                  <td className={`${td} text-right tabular-nums`}>{formatMoney(party.rate)}/kg</td>
                  <td className={`${td} text-right`}>
                    <Balance amount={party.balance} />
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{formatDay(party.deletedAt)}</td>
                  <td className={td}>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        party.daysLeft <= 5 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {party.daysLeft} day{party.daysLeft === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <Button size="sm" variant="secondary" onClick={() => restore(party)}>
                      Restore
                    </Button>{' '}
                    <Button size="sm" variant="danger" onClick={() => setDestroying(party)}>
                      Delete now
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {destroying && (
        <ConfirmDialog
          title={`Delete ${destroying.name} permanently?`}
          message="Their ledger entries are deleted too. This cannot be undone."
          confirmLabel="Delete permanently"
          onConfirm={async () => {
            await api.delete(`${config.api}/${destroying._id}/permanent`)
            reload()
          }}
          onClose={() => setDestroying(null)}
        />
      )}
    </>
  )
}
