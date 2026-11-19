import { useEffect, useState, type FormEvent } from 'react'
import { getItems, createItem, deleteItem, type Item } from './api/items'
import './App.css'

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getItems()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const item = await createItem({ name })
      setItems((prev) => [item, ...prev])
      setName('')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteItem(id)
      setItems((prev) => prev.filter((item) => item._id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <main className="container">
      <h1>MERN App</h1>

      <form onSubmit={handleSubmit} className="item-form">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New item name"
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="muted">No items yet.</p>
      ) : (
        <ul className="item-list">
          {items.map((item) => (
            <li key={item._id}>
              <span>{item.name}</span>
              <button onClick={() => handleDelete(item._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
