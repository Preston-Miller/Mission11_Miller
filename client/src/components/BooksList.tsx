import { useEffect, useMemo, useState } from 'react'

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5076'

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

  return (
    <div className="container my-4">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
        <div>
          <h2 className="mb-1">Hilton Online Bookstore</h2>
          <div className="text-muted small">{totalCount} books total</div>
        </div>
      </div>

      <div className="row g-3 align-items-end mb-3">
        <div className="col-12 col-md-4">
          <label className="form-label">Results per page</label>
          <select
            className="form-select"
            value={pageSize}
            onChange={(e) => {
              setPageNumber(1)
              setPageSize(Number(e.target.value))
            }}
          >
            {[5, 10, 15, 20, 25].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label">Sort by title</label>
          <select
            className="form-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value === 'desc' ? 'desc' : 'asc')}
          >
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
          </select>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {loading ? <div className="text-muted">Loading...</div> : null}

      {!loading ? (
        <>
          <div className="row g-3">
            {items.map((book) => (
              <div key={resolveBookId(book)} className="col-12">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title mb-2">{book.title}</h5>
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
                <button className="page-link" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
                  Previous
                </button>
              </li>

              {pageNumbers.map((p, idx) => {
                if (p === 'ellipsis') {
                  return (
                    <li key={`e-${idx}`} className="page-item disabled">
                      <span className="page-link">...</span>
                    </li>
                  )
                }

                return (
                  <li key={p} className={`page-item ${p === pageNumber ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPageNumber(p)}>
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
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>

          <div className="text-muted small text-center mt-2">
            Page {pageNumber} of {totalPages}
          </div>
        </>
      ) : null}
    </div>
  )
}

