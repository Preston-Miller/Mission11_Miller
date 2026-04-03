import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../apiBase'

type Book = {
  // Depending on JSON naming policy, the ID field can be `bookId` or `bookID`.
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

export default function BooksList() {
  const blackStyle = { color: '#000' }
  const whitePageStyle = { color: '#000', backgroundColor: '#fff' }
  const whiteCardStyle = { color: '#000', backgroundColor: '#fff' }

  const [items, setItems] = useState<Book[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [totalPages, setTotalPages] = useState(1)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageNumbers = useMemo(() => getPageNumbers(totalPages, pageNumber), [totalPages, pageNumber])

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          pageNumber: String(pageNumber),
          pageSize: String(pageSize),
          sortBy: 'title',
          sortOrder
        })

        const res = await fetch(`${API_BASE_URL}/api/books?${params.toString()}`, {
          signal: controller.signal
        })

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`)
        }

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

    load()
    return () => controller.abort()
  }, [pageNumber, pageSize, sortOrder])

  function handleRemoveLine(bookId: number) {
    setCart((prev) => prev.filter((item) => resolveBookId(item.book) !== bookId))
  }

  function handleClearCart() {
    if (cart.length === 0) return
    if (!window.confirm('Remove all items from your cart?')) return
    setCart([])
  }

  return (
    <div className="container my-4" style={whitePageStyle}>
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
        <div>
          <h2 className="mb-1" style={blackStyle}>
            Miller Online Bookstore
          </h2>
          <div className="small" style={blackStyle}>
            {totalCount} books total
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Link className="btn btn-outline-secondary" to="/adminbooks">
              Admin books
            </Link>
            <button className="btn btn-outline-dark" onClick={() => setIsCartOpen(true)}>
              Open Cart ({totalItems})
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3 align-items-end mb-3">
        <div className="col-12 col-md-4">
          <label className="form-label" style={blackStyle}>
            Results per page
          </label>
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
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label" style={blackStyle}>
            Sort by title
          </label>
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
                    <h5 className="card-title mb-2" style={blackStyle}>
                      {book.title}
                    </h5>
                    <div className="mb-2">
                      <div>
                        <strong>Author:</strong> {book.author}
                      </div>
                      <div>
                        <strong>Publisher:</strong> {book.publisher}
                      </div>
                      <div>
                        <strong>ISBN:</strong> {book.isbn}
                      </div>
                      <div>
                        <strong>Classification:</strong> {book.classification}
                      </div>
                      <div>
                        <strong>Category:</strong> {book.category}
                      </div>
                      <div>
                        <strong>Number of Pages:</strong> {book.pageCount}
                      </div>
                      <div>
                        <strong>Price:</strong> ${book.price.toFixed(2)}
                      </div>
                    </div>
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
                      <span className="page-link" style={blackStyle}>
                        ...
                      </span>
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
                        <th aria-label="Remove" />
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
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveLine(id)}
                                title="Remove from cart"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={handleClearCart}>
                    Clear cart
                  </button>
                  <div className="fw-semibold">Total: ${cartTotal.toFixed(2)}</div>
                </div>
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
        </>
      ) : null}
    </div>
  )
}

