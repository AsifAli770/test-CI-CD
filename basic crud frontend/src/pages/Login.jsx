import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Alert, Button, Field, Input } from '../components/ui'
import { api } from '../lib/api'
import { getToken, saveLogin } from '../lib/auth'
import { checks, useErrors } from '../lib/validate'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const { errors, validate, clear } = useErrors()

  if (getToken()) return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault()
    const valid = validate({
      username: [form.username, checks.required('Username')],
      password: [form.password, checks.required('Password')],
    })
    if (!valid) return
    setError(null)
    setSaving(true)
    try {
      saveLogin(await api.post('/auth/login', form))
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-brand-700 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-slate-900 px-8 py-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-2xl">🥛</div>
          <h1 className="text-lg font-semibold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to manage your dairy</p>
        </div>
        <form onSubmit={submit} noValidate className="space-y-4 p-8">
          <Alert onClose={() => setError(null)}>{error}</Alert>
          <Field label="Username" error={errors.username}>
            <Input
              value={form.username}
              onChange={(e) => {
                setForm({ ...form, username: e.target.value })
                clear('username')
              }}
              autoComplete="username"
              autoFocus
            />
          </Field>
          <Field label="Password" error={errors.password}>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value })
                clear('password')
              }}
              autoComplete="current-password"
            />
          </Field>
          <Button type="submit" className="w-full py-2.5" disabled={saving}>
            {saving ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
