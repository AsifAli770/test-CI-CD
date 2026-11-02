import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import { getToken } from './lib/auth'
import { PARTIES } from './lib/parties'
import Credit from './pages/Credit'
import Login from './pages/Login'
import Orders from './pages/Orders'
import PartyArchive from './pages/PartyArchive'
import PartyLedger from './pages/PartyLedger'
import PartyList from './pages/PartyList'

// Only logged-in users get past this; everyone else goes to /login
function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { customer, supplier } = PARTIES
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="customers" element={<PartyList key="customers" config={customer} />} />
        <Route path="customers/ledger" element={<PartyLedger key="customers" config={customer} />} />
        <Route path="customers/archive" element={<PartyArchive key="customers" config={customer} />} />
        <Route path="suppliers" element={<PartyList key="suppliers" config={supplier} />} />
        <Route path="suppliers/ledger" element={<PartyLedger key="suppliers" config={supplier} />} />
        <Route path="suppliers/archive" element={<PartyArchive key="suppliers" config={supplier} />} />
        <Route path="orders" element={<Orders key="open" />} />
        <Route path="orders/done" element={<Orders key="done" done />} />
        <Route path="credit" element={<Credit key="pending" />} />
        <Route path="credit/done" element={<Credit key="done" done />} />
        <Route path="*" element={<Navigate to="/customers" replace />} />
      </Route>
    </Routes>
  )
}
