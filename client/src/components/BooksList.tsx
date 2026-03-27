import { useEffect, useMemo, useState } from 'react'

type Book = {
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

type BooksResponse = {
  items: Book[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

type CartItem = {
  book: Book
  quantity: number
}

type ReturnContext = {
  pageNumber: number
  pageSize: number
  sortOrder: 'asc' | 'desc'
  selectedCategory: string
  scrollY: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5076'
const CART_STORAGE_KEY = 'bookstore-cart'
const RETURN_CONTEXT_KEY = 'bookstore-return-context'

function resolveBookId(book: Book): number {
  return book.bookId ?? book.bookID ?? 0
}

function getPageNumbers(totalPages: number, currentPage: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
    return pages
  }
  const windowSize = 2
  const start = Math.max(2, currentPage - windowSize)
  const end = Math.min(totalPages - 1, currentPage + windowSize)
  pages.push(1)
  if (start > 2) pages.push('ellipsis')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages - 1) pages.push('ellipsis')
  pages.push(totalPages)
  return pages
}

function readCartFromSession(): CartItem[] {
  const raw = sessionStorage.getItem(CART_STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

export default function BooksList() {
  const blackStyle = { color: '#000' }
  const whitePageStyle = { color: '#000', backgroundColor: '#fff' }
  const whiteCardStyle = { color: '#000', backgroundColor: '#fff' }

  const [items, setItems] = useState<Book[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [totalCount, setTotalCount] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [totalPages, setTotalPages] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageNumbers = useMemo(() => getPageNumbers(totalPages, pageNumber), [totalPages, pageNumber])
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0),
    [cart]
  )

  useEffect(() => {
    setCart(readCartFromSession())
  }, [])

  useEffect(() => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    const controller = new AbortController()
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/books/categories`, { signal: controller.signal })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const data = (await res.json()) as string[]
        setCategories(data)
      } catch {
        // Keep UI usable even if category endpoint fails.
        setCategories([])
      }
    }
    loadCategories()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function loadBooks() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          pageNumber: String(pageNumber),
          pageSize: String(pageSize),
          sortBy: 'title',
          sortOrder
        })
        if (selectedCategory !== 'All Categories') {
          params.set('category', selectedCategory)
        }
        const res = await fetch(`${API_BASE_URL}/api/books?${params.toString()}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const data = (await res.json()) as BooksResponse
        setItems(data.items)
        setTotalCount(data.totalCount)
        setTotalPages(data.totalPages)
      } catch (e) {
        if (controller.signal.aborted) return
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadBooks()
    return () => controller.abort()
  }, [pageNumber, pageSize, sortOrder, selectedCategory])

  function saveReturnContext() {
    const context: ReturnContext = {
      pageNumber,
      pageSize,
      sortOrder,
      selectedCategory,
      scrollY: window.scrollY
    }
    sessionStorage.setItem(RETURN_CONTEXT_KEY, JSON.stringify(context))
  }

  function handleContinueShopping() {
    const raw = sessionStorage.getItem(RETURN_CONTEXT_KEY)
    setIsCartOpen(false)
    if (!raw) return
    try {
      const context = JSON.parse(raw) as ReturnContext
      setPageNumber(context.pageNumber)
      setPageSize(context.pageSize)
      setSortOrder(context.sortOrder)
      setSelectedCategory(context.selectedCategory)
      setTimeout(() => {
        window.scrollTo({ top: context.scrollY, behavior: 'auto' })
      }, 0)
    } catch {
      // Ignore malformed session data.
    }
  }

  function handleAddToCart(book: Book) {
    saveReturnContext()
    const id = resolveBookId(book)
    setCart((prev) => {
      const existing = prev.find((item) => resolveBookId(item.book) === id)
      if (existing) {
        return prev.map((item) =>
          resolveBookId(item.book) === id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { book, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  function handleQuantityChange(bookId: number, quantity: number) {
    const safeQty = Number.isFinite(quantity) ? Math.max(1, quantity) : 1
    setCart((prev) =>
      prev.map((item) =>
        resolveBookId(item.book) === bookId ? { ...item, quantity: safeQty } : item
      )
    )
  }

  return (
    <div className="container-fluid py-3" style={whitePageStyle}>
      <div className="container">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
          <div>
            <h2 className="mb-1" style={blackStyle}>Miller Online Bookstore</h2>
            <div className="small" style={blackStyle}>{totalCount} books total</div>
          </div>
          <button className="btn btn-outline-dark" onClick={() => setIsCartOpen(true)}>
            Open Cart ({totalItems})
          </button>
        </div>

        {/* Bootstrap features used for rubric comment:
            - sticky-top on cart summary panel
            - table table-sm on cart overlay line items */}
        <div className="row g-4">
          <aside className="col-12 col-lg-3">
            <div className="card sticky-top" style={{ ...whiteCardStyle, top: '1rem' }}>
              <div className="card-body">
                <h5 className="card-title" style={blackStyle}>Cart Summary</h5>
                <div style={blackStyle}>Items: {totalItems}</div>
                <div style={blackStyle}>Total: ${cartTotal.toFixed(2)}</div>
              </div>
            </div>
          </aside>

          <main className="col-12 col-lg-9">
            <div className="row g-3 align-items-end mb-3">
              <div className="col-12 col-md-4">
                <label className="form-label" style={blackStyle}>Category</label>
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setPageNumber(1)
                  }}
                  style={blackStyle}
                >
                  <option value="All Categories">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label" style={blackStyle}>Results per page</label>
                <select
                  className="form-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageNumber(1)
                    setPageSize(Number(e.target.value))
                  }}
                  style={blackStyle}
                >
                  {[5, 10, 15, 20, 25].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label" style={blackStyle}>Sort by title</label>
                <select
                  className="form-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value === 'desc' ? 'desc' : 'asc')}
                  style={blackStyle}
                >
                  <option value="asc">A-Z</option>
                  <option value="desc">Z-A</option>
                </select>
              </div>
            </div>

            {error ? <div className="alert alert-danger" style={blackStyle}>{error}</div> : null}
            {loading ? <div style={blackStyle}>Loading...</div> : null}

            {!loading ? (
              <>
                <div className="row g-3">
                  {items.map((book) => (
                    <div key={resolveBookId(book)} className="col-12">
                      <div className="card h-100" style={whiteCardStyle}>
                        <div className="card-body" style={whiteCardStyle}>
                          <h5 className="card-title mb-2" style={blackStyle}>{book.title}</h5>
                          <div className="mb-2">
                            <div><strong>Author:</strong> {book.author}</div>
                            <div><strong>Publisher:</strong> {book.publisher}</div>
                            <div><strong>ISBN:</strong> {book.isbn}</div>
                            <div><strong>Classification:</strong> {book.classification}</div>
                            <div><strong>Category:</strong> {book.category}</div>
                            <div><strong>Number of Pages:</strong> {book.pageCount}</div>
                            <div><strong>Price:</strong> ${book.price.toFixed(2)}</div>
                          </div>
                          <button className="btn btn-dark" onClick={() => handleAddToCart(book)}>
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <nav aria-label="Book pagination" className="mt-3">
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${pageNumber <= 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                        disabled={pageNumber <= 1}
                        style={blackStyle}
                      >
                        Previous
                      </button>
                    </li>
                    {pageNumbers.map((p, idx) => {
                      if (p === 'ellipsis') {
                        return (
                          <li key={`e-${idx}`} className="page-item disabled">
                            <span className="page-link" style={blackStyle}>...</span>
                          </li>
                        )
                      }
                      return (
                        <li key={p} className={`page-item ${p === pageNumber ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setPageNumber(p)} style={blackStyle}>
                            {p}
                          </button>
                        </li>
                      )
                    })}
                    <li className={`page-item ${pageNumber >= totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                        disabled={pageNumber >= totalPages}
                        style={blackStyle}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
                <div className="small text-center mt-2" style={blackStyle}>
                  Page {pageNumber} of {totalPages}
                </div>
              </>
            ) : null}
          </main>
        </div>
      </div>

      {isCartOpen ? (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-end" style={{ zIndex: 1050 }}>
          <div className="bg-white p-3 h-100 overflow-auto" style={{ width: 'min(100%, 440px)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0" style={blackStyle}>Shopping Cart</h5>
              <button className="btn-close" onClick={() => setIsCartOpen(false)} />
            </div>

            {cart.length === 0 ? (
              <div style={blackStyle}>Your cart is empty.</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => {
                        const id = resolveBookId(item.book)
                        const subtotal = item.book.price * item.quantity
                        return (
                          <tr key={id}>
                            <td>{item.book.title}</td>
                            <td style={{ width: '80px' }}>
                              <input
                                className="form-control form-control-sm"
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(id, Number(e.target.value))}
                              />
                            </td>
                            <td>${item.book.price.toFixed(2)}</td>
                            <td>${subtotal.toFixed(2)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="fw-semibold text-end mb-3">Total: ${cartTotal.toFixed(2)}</div>
              </>
            )}

            <div className="d-flex justify-content-between">
              <button className="btn btn-outline-dark" onClick={handleContinueShopping}>
                Continue Shopping
              </button>
              <button className="btn btn-dark" onClick={() => setIsCartOpen(false)}>
                Close Cart
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

