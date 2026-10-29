import { useEffect, useState } from 'react'
import { createItem, deleteItem, getItems, updateItem } from './api'
import './App.css'

const emptyForm = { name: '', description: '' }

function App() {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required')
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
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setForm({ name: item.name, description: item.description || '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    setError('')
    try {
      await deleteItem(id)
      setItems(items.filter((item) => item.id !== id))
      if (editingId === id) resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="container">
      <h1>Items</h1>

      <form className="item-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit item' : 'Add item'}</h2>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows="3"
          value={form.description}
          onChange={handleChange}
        />
        <div className="actions">
          <button type="submit">{editingId ? 'Update' : 'Add'}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="muted">No items yet. Add one above.</p>
      ) : (
        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id} className={item.id === editingId ? 'editing' : ''}>
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
    </main>
  )
}

export default App
