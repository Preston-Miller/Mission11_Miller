import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../apiBase'

type BookRow = {
  bookId?: number
  bookID?: number
  title: string
  author: string
  publisher: string
  isbn: string
  classification: string
  category: string
  pageCount: number
  price: number
}

function resolveBookId(book: BookRow): number {
  return book.bookId ?? book.bookID ?? 0
}

type FormState = {
  title: string
  author: string
  publisher: string
  isbn: string
  classification: string
  category: string
  pageCount: string
  price: string
}

const emptyForm: FormState = {
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  classification: '',
  category: '',
  pageCount: '1',
  price: '0'
}

export default function AdminBooks() {
  const formCardRef = useRef<HTMLDivElement>(null)
  const [books, setBooks] = useState<BookRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  function scrollFormIntoView() {
    // Double rAF: run after React commits the DOM update (header text, field values).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        const first = formCardRef.current?.querySelector<HTMLInputElement>('input')
        first?.focus({ preventScroll: true })
      })
    })
  }

  const loadBooks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/books/admin`)
      if (!res.ok) throw new Error(`Failed to load books (${res.status})`)
      const data = (await res.json()) as BookRow[]
      setBooks(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load books')
      setBooks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  function bookToForm(book: BookRow): FormState {
    return {
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      isbn: book.isbn,
      classification: book.classification,
      category: book.category,
      pageCount: String(book.pageCount),
      price: String(book.price)
    }
  }

  function startAdd() {
    setEditingId(null)
    setForm(emptyForm)
    scrollFormIntoView()
  }

  function startEdit(book: BookRow) {
    setEditingId(resolveBookId(book))
    setForm(bookToForm(book))
    scrollFormIntoView()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const pageCount = Number.parseInt(form.pageCount, 10)
    const price = Number.parseFloat(form.price)
    if (!Number.isFinite(pageCount) || pageCount < 1) {
      setError('Page count must be a number at least 1.')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setError('Price must be a number zero or greater.')
      return
    }

    const body = {
      title: form.title.trim(),
      author: form.author.trim(),
      publisher: form.publisher.trim(),
      isbn: form.isbn.trim(),
      classification: form.classification.trim(),
      category: form.category.trim(),
      pageCount,
      price
    }

    setSaving(true)
    setError(null)
    try {
      if (editingId != null) {
        const res = await fetch(`${API_BASE_URL}/api/books/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Update failed (${res.status})`)
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/books`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Create failed (${res.status})`)
        }
      }
      setForm(emptyForm)
      setEditingId(null)
      await loadBooks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(book: BookRow) {
    const id = resolveBookId(book)
    if (!window.confirm(`Delete "${book.title}"?`)) return
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/books/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Delete failed (${res.status})`)
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm)
      }
      await loadBooks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">Admin — Books</h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-primary" to="/">
            Back to store
          </Link>
          <button type="button" className="btn btn-outline-secondary" onClick={startAdd}>
            Add new book
          </button>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card mb-4" ref={formCardRef}>
        <div className="card-header">
          {editingId == null ? 'Add book' : `Edit book #${editingId}`}
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Title</label>
              <input
                className="form-control"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Author</label>
              <input
                className="form-control"
                required
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Publisher</label>
              <input
                className="form-control"
                required
                value={form.publisher}
                onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">ISBN</label>
              <input
                className="form-control"
                required
                value={form.isbn}
                onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Classification</label>
              <input
                className="form-control"
                required
                value={form.classification}
                onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Category</label>
              <input
                className="form-control"
                required
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Page count</label>
              <input
                className="form-control"
                type="number"
                min={1}
                required
                value={form.pageCount}
                onChange={(e) => setForm((f) => ({ ...f, pageCount: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Price</label>
              <input
                className="form-control"
                type="number"
                min={0}
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="col-12 d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {editingId == null ? 'Create' : 'Save changes'}
              </button>
              {editingId != null ? (
                <button type="button" className="btn btn-outline-secondary" onClick={startAdd} disabled={saving}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      <h2 className="h5 mb-3">All books</h2>
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Price</th>
                <th style={{ width: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => {
                const id = resolveBookId(b)
                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{b.title}</td>
                    <td>{b.author}</td>
                    <td>{b.category}</td>
                    <td>${b.price.toFixed(2)}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => startEdit(b)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(b)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
