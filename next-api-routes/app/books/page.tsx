"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BookOpen, Search, Plus, X, Pencil, Trash2,
  CheckCircle2, AlertCircle, Filter, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react"

interface Book {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
  authorId: string
  author: { id: string; name: string }
}

interface Author {
  id: string
  name: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface SearchResponse {
  data: Book[]
  pagination: Pagination
}

const GENRES = [
  "Novela", "Cuento", "Poesía", "Ensayo", "Teatro",
  "Biografía", "Historia", "Ciencia Ficción", "Fantasía",
  "Terror", "Misterio", "Romance", "Aventura", "Periodismo",
  "Filosofía", "Otro"
]

const inputCls = "w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200 text-surface-800 placeholder-surface-400"
const btnPrimaryCls = "inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-surface-800 to-surface-700 text-white font-medium rounded-xl hover:from-surface-900 hover:to-surface-800 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
const btnSecondaryCls = "inline-flex items-center gap-2 px-5 py-2.5 bg-white text-surface-700 font-medium border border-surface-200 rounded-xl hover:bg-surface-50 hover:border-surface-300 hover:shadow-sm active:scale-[0.98] transition-all duration-200 disabled:opacity-30"
const btnDangerCls = "inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium rounded-xl hover:from-red-600 hover:to-rose-600 hover:shadow-lg active:scale-[0.98] transition-all duration-200 text-sm"
const btnWarningCls = "inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-yellow-600 hover:shadow-lg active:scale-[0.98] transition-all duration-200 text-sm"
const cardCls = "bg-white rounded-2xl shadow-lg shadow-primary-500/5 border border-surface-200/50"
const skeletonCls = "animate-pulse bg-surface-200 rounded-xl"
const badgeSurfaceCls = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-600"

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [genre, setGenre] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [order, setOrder] = useState("desc")
  const [page, setPage] = useState(1)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const [showForm, setShowForm] = useState(false)
  const [editBookId, setEditBookId] = useState<string | null>(null)
  const [bookForm, setBookForm] = useState({
    title: "", description: "", isbn: "", publishedYear: "",
    genre: "", pages: "", authorId: ""
  })

  const limit = 10

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (genre) params.set("genre", genre)
      if (authorName) params.set("authorName", authorName)
      params.set("sortBy", sortBy)
      params.set("order", order)
      params.set("page", page.toString())
      params.set("limit", limit.toString())

      const res = await fetch(`/api/books/search?${params}`)
      if (!res.ok) throw new Error("Error al buscar")
      const data: SearchResponse = await res.json()
      setBooks(data.data)
      setPagination(data.pagination)
    } catch {
      setError("Error al cargar libros")
    } finally {
      setLoading(false)
    }
  }, [search, genre, authorName, sortBy, order, page])

  const fetchAuthors = async () => {
    try {
      const res = await fetch("/api/authors")
      const data = await res.json()
      setAuthors(data)
    } catch {
      // ignore
    }
  }

  useEffect(() => { fetchAuthors() }, [])
  useEffect(() => { fetchBooks() }, [fetchBooks])

  const resetForm = () => {
    setBookForm({ title: "", description: "", isbn: "", publishedYear: "", genre: "", pages: "", authorId: "" })
    setEditBookId(null)
  }

  const handleEditBook = (book: Book) => {
    setEditBookId(book.id)
    setBookForm({
      title: book.title,
      description: book.description || "",
      isbn: book.isbn || "",
      publishedYear: book.publishedYear?.toString() || "",
      genre: book.genre || "",
      pages: book.pages?.toString() || "",
      authorId: book.authorId,
    })
    setShowForm(true)
    setError("")
    setSuccessMsg("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")
    try {
      const payload = {
        ...bookForm,
        publishedYear: bookForm.publishedYear ? parseInt(bookForm.publishedYear) : null,
        pages: bookForm.pages ? parseInt(bookForm.pages) : null,
      }

      const res = await fetch(`/api/books${editBookId ? `/${editBookId}` : ""}`, {
        method: editBookId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al guardar")
      }
      setSuccessMsg(editBookId ? "Libro actualizado exitosamente" : "Libro creado exitosamente")
      setShowForm(false)
      resetForm()
      fetchBooks()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteBook = async (id: string) => {
    setError("")
    setSuccessMsg("")
    if (!confirm("¿Eliminar este libro?")) return
    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      setSuccessMsg("Libro eliminado correctamente")
      if (books.length === 1 && page > 1) setPage(p => p - 1)
      else fetchBooks()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-surface-900">Libros</h1>
          <p className="mt-1 text-surface-500">Busca, filtra y gestiona libros</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); setError(""); setSuccessMsg("") }} className={btnPrimaryCls}>
          {showForm ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Nuevo Libro</>}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="ml-auto text-emerald-400 hover:text-emerald-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {showForm && (
        <div className={`${cardCls} p-6 sm:p-8`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white">
              {editBookId ? <Pencil className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-surface-900">{editBookId ? "Editar Libro" : "Nuevo Libro"}</h2>
              <p className="text-sm text-surface-500">{editBookId ? "Actualiza los datos del libro" : "Ingresa los datos del nuevo libro"}</p>
            </div>
          </div>
          <form onSubmit={handleSubmitBook} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Título *</label>
                <input type="text" required value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} className={inputCls} placeholder="Ej: Cien años de soledad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Autor *</label>
                <select required value={bookForm.authorId} onChange={e => setBookForm({ ...bookForm, authorId: e.target.value })} className={inputCls}>
                  <option value="">Seleccionar autor...</option>
                  {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Género</label>
                <select value={bookForm.genre} onChange={e => setBookForm({ ...bookForm, genre: e.target.value })} className={inputCls}>
                  <option value="">Seleccionar...</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Año de publicación</label>
                <input type="number" value={bookForm.publishedYear} onChange={e => setBookForm({ ...bookForm, publishedYear: e.target.value })} className={inputCls} placeholder="Ej: 1967" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Páginas</label>
                <input type="number" value={bookForm.pages} onChange={e => setBookForm({ ...bookForm, pages: e.target.value })} className={inputCls} placeholder="Ej: 417" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">ISBN</label>
                <input type="text" value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} className={inputCls} placeholder="Ej: 978-84-376-0494-7" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Descripción</label>
                <textarea rows={3} value={bookForm.description} onChange={e => setBookForm({ ...bookForm, description: e.target.value })} className={inputCls} placeholder="Breve descripción del libro..." />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className={btnPrimaryCls}>
                {editBookId ? <><Pencil className="w-4 h-4" /> Guardar Cambios</> : <><Plus className="w-4 h-4" /> Crear Libro</>}
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm() }} className={btnSecondaryCls}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={`${cardCls} p-5 sm:p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-surface-500" />
          <span className="font-medium text-surface-700">Filtros de búsqueda</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Buscar por título</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input type="text" placeholder="Buscar libro..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className={`${inputCls} text-sm pl-9`} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Género</label>
            <select value={genre} onChange={e => { setGenre(e.target.value); setPage(1) }} className={`${inputCls} text-sm`}>
              <option value="">Todos los géneros</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Autor</label>
            <select value={authorName} onChange={e => { setAuthorName(e.target.value); setPage(1) }} className={`${inputCls} text-sm`}>
              <option value="">Todos los autores</option>
              {authors.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Ordenar por</label>
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }} className={`${inputCls} text-sm`}>
              <option value="createdAt">Fecha creación</option>
              <option value="title">Título</option>
              <option value="publishedYear">Año publicación</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Orden</label>
            <select value={order} onChange={e => { setOrder(e.target.value); setPage(1) }} className={`${inputCls} text-sm`}>
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
        </div>
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        <div className="p-6 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Resultados</h2>
              <p className="text-sm text-surface-500">
                {pagination ? `${pagination.total} libro${pagination.total !== 1 ? "s" : ""} encontrado${pagination.total !== 1 ? "s" : ""}` : "Buscando..."}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="space-y-2 flex-1">
                  <div className={`${skeletonCls} h-5 w-64`} />
                  <div className={`${skeletonCls} h-4 w-48`} />
                </div>
                <div className={`${skeletonCls} h-9 w-40 ml-4`} />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="p-16 text-center">
            <Search className="w-16 h-16 mx-auto text-surface-300" />
            <p className="mt-4 text-surface-500 font-medium">No se encontraron libros</p>
            <p className="mt-1 text-sm text-surface-400">Intenta con otros filtros de búsqueda</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {books.map(book => (
              <div key={book.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-surface-50/50 transition-colors group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-surface-900">{book.title}</h3>
                      {book.genre && <span className={badgeSurfaceCls}>{book.genre}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-surface-500 mt-0.5 flex-wrap">
                      <span className="text-primary-600 font-medium">{book.author.name}</span>
                      {book.publishedYear && <span>· {book.publishedYear}</span>}
                      {book.pages && <span>· {book.pages} pág.</span>}
                    </div>
                    {book.description && <p className="text-sm text-surface-400 mt-1 line-clamp-1">{book.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleEditBook(book)} className={btnWarningCls}>
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => handleDeleteBook(book.id)} className={btnDangerCls}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="p-6 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-surface-500">Página {pagination.page} de {pagination.totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(1)} disabled={!pagination.hasPrev} className={`${btnSecondaryCls} text-sm p-2`}>
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className={`${btnSecondaryCls} text-sm px-3 py-2`}>
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  let pageNum: number
                  if (pagination.totalPages <= 5) pageNum = i + 1
                  else if (pagination.page <= 3) pageNum = i + 1
                  else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i
                  else pageNum = pagination.page - 2 + i
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 text-sm font-medium rounded-xl transition-all duration-200 ${
                        pageNum === pagination.page
                          ? "bg-primary-600 text-white shadow-md shadow-primary-500/25"
                          : "bg-white border border-surface-200 text-surface-600 hover:bg-surface-50"
                      }`}>{pageNum}</button>
                  )
                })}
              </div>
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className={`${btnSecondaryCls} text-sm px-3 py-2`}>
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(pagination.totalPages)} disabled={!pagination.hasNext} className={`${btnSecondaryCls} text-sm p-2`}>
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}