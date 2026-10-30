import { useEffect, useState } from 'react'
import { createItem, deleteItem, getItems, updateItem } from './api'
import './App.css'

const emptyForm = { name: '', description: '' }

function App() {
  const [view, setView] = useState('dashboard')
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getItems()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const goTo = (nextView) => {
    if (nextView === 'add') resetForm()
    setError('')
    setView(nextView)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Task name is required')
      return
    }
    setError('')
    try {
      if (editingId) {
        const updated = await updateItem(editingId, form)
        setItems(items.map((item) => (item.id === editingId ? updated : item)))
      } else {
        const created = await createItem(form)
        setItems([...items, created])
      }
      resetForm()
      setView('dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setForm({ name: item.name, description: item.description || '' })
    setError('')
    setView('add')
  }

  const handleCancel = () => {
    resetForm()
    goTo('dashboard')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    setError('')
    try {
      await deleteItem(id)
      setItems(items.filter((item) => item.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Tasks</div>
        <nav>
          <button
            className={`nav-link ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => goTo('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-link ${view === 'add' ? 'active' : ''}`}
            onClick={() => goTo('add')}
          >
            Add Task
          </button>
        </nav>
      </aside>

      <main className="content">
        {view === 'dashboard' ? (
          <>
            <header className="page-header">
              <h1>Dashboard</h1>
              <span className="count">
                {items.length} {items.length === 1 ? 'task' : 'tasks'}
              </span>
            </header>

            {error && <p className="error">{error}</p>}

            {loading ? (
              <p className="muted">Loading…</p>
            ) : items.length === 0 ? (
              <div className="empty">
                <p>No tasks yet.</p>
                <button onClick={() => goTo('add')}>Add your first task</button>
              </div>
            ) : (
              <ul className="item-list">
                {items.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      {item.description && <p>{item.description}</p>}
                    </div>
                    <div className="actions">
                      <button className="secondary" onClick={() => handleEdit(item)}>
                        Edit
                      </button>
                      <button className="danger" onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <header className="page-header">
              <h1>{editingId ? 'Edit Task' : 'Add Task'}</h1>
            </header>

            <form className="item-form" onSubmit={handleSubmit}>
              <label>
                Task name
                <input
                  name="name"
                  placeholder="e.g. Buy groceries"
                  value={form.name}
                  onChange={handleChange}
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  placeholder="Optional details"
                  rows="4"
                  value={form.description}
                  onChange={handleChange}
                />
              </label>
              {error && <p className="error">{error}</p>}
              <div className="actions">
                <button type="submit">{editingId ? 'Update Task' : 'Add Task'}</button>
                <button type="button" className="secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  )
}

export default App
