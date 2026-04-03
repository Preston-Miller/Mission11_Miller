import { Route, Routes } from 'react-router-dom'
import BooksList from './components/BooksList'
import AdminBooks from './pages/AdminBooks'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BooksList />} />
      <Route path="/adminbooks" element={<AdminBooks />} />
    </Routes>
  )
}
