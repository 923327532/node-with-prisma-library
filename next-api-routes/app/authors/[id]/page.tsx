"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  User, Globe, Calendar, BookOpen, Pencil, Trash2, Plus,
  CheckCircle2, AlertCircle, X, BarChart3, ArrowLeft,
  Tag, TrendingUp, TrendingDown, BookMarked
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
}

interface AuthorStats {
  authorId: string
  authorName: string
  totalBooks: number
  firstBook: { title: string; year: number | null } | null
  latestBook: { title: string; year: number | null } | null
  averagePages: number | null
  genres: string[]
  longestBook: { title: string; pages: number | null } | null
  shortestBook: { title: string; pages: number | null } | null
}

interface Author {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  books: Book[]
  _count: { books: number }
}

const GENRES = [
  "Novela", "Cuento", "Poesía", "Ensayo", "Teatro",
  "Biografía", "Historia", "Ciencia Ficción", "Fantasía",
  "Terror", "Misterio", "Romance", "Aventura", "Periodismo",
  "Filosofía", "Otro"
]

const inputCls = "w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200 text-surface-800 placeholder-surface-400"
const btnPrimaryCls = "inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-surface-800 to-surface-700 text-white font-medium rounded-xl hover:from-surface-900 hover:to-surface-800 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
const btnSecondaryCls = "inline-flex items-center gap-2 px-5 py-2.5 bg-white text-surface-700 font-medium border border-surface-200 rounded-xl hover:bg-surface-50 hover:border-surface-300 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
const btnDangerCls = "inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium rounded-xl hover:from-red-600 hover:to-rose-600 hover:shadow-lg active:scale-[0.98] transition-all duration-200 text-sm"
const cardCls = "bg-white rounded-2xl shadow-lg shadow-primary-500/5 border border-surface-200/50"
const skeletonCls = "animate-pulse bg-surface-200 rounded-xl"
const badgeSurfaceCls = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-600"

export default function AuthorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [author, setAuthor] = useState<Author | null>(null)
  const [stats, setStats] = useState<AuthorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", bio: "", nationality: "", birthYear: "" })

  const [showBookForm, setShowBookForm] = useState(false)
  const [bookForm, setBookForm] = useState({
    title: "", description: "", isbn: "", publishedYear: "",
    genre: "", pages: ""
  })

  const fetchAuthor = async () => {
    try {
      const res = await fetch(`/api/authors/${id}`)
      if (!res.ok) throw new Error("Autor no encontrado")
      const data: Author = await res.json()
      setAuthor(data)
      setForm({
        name: data.name,
        email: data.email,
        bio: data.bio || "",
        nationality: data.nationality || "",
        birthYear: data.birthYear?.toString() || "",
      })
    } catch {
      setError("Error al cargar autor")
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/authors/${id}/stats`)
      if (res.ok) {
        const data: AuthorStats = await res.json()
        setStats(data)
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchAuthor(), fetchStats()]).finally(() => setLoading(false))
  }, [id])

  const handleUpdateAuthor = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")
    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, birthYear: form.birthYear ? parseInt(form.birthYear) : null }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al actualizar")
      }
      setSuccessMsg("Autor actualizado correctamente")
      setEditing(false)
      fetchAuthor()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookForm,
          authorId: id,
          publishedYear: bookForm.publishedYear ? parseInt(bookForm.publishedYear) : null,
          pages: bookForm.pages ? parseInt(bookForm.pages) : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al crear libro")
      }
      setSuccessMsg("Libro agregado exitosamente")
      setShowBookForm(false)
      setBookForm({ title: "", description: "", isbn: "", publishedYear: "", genre: "", pages: "" })
      fetchAuthor()
      fetchStats()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    setError("")
    setSuccessMsg("")
    if (!confirm("¿Eliminar este libro?")) return
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      setSuccessMsg("Libro eliminado correctamente")
      fetchAuthor()
      fetchStats()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteAuthor = async () => {
    setError("")
    setSuccessMsg("")
    if (!confirm("¿Estás seguro de eliminar este autor y todos sus libros?")) return
    try {
      const res = await fetch(`/api/authors/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      router.push("/")
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return (
    <div className="space-y-8">
      {[1, 2, 3].map(i => (
        <div key={i} className={`${cardCls} p-8`}>
          <div className="space-y-4">
            <div className={`${skeletonCls} h-8 w-64`} />
            <div className={`${skeletonCls} h-4 w-96`} />
            <div className={`${skeletonCls} h-4 w-48`} />
          </div>
        </div>
      ))}
    </div>
  )

  if (error && !author) return (
    <div className="text-center py-20">
      <AlertCircle className="w-16 h-16 mx-auto text-surface-300" />
      <p className="mt-4 text-surface-500 font-medium">{error}</p>
      <button onClick={() => router.push("/")} className={`${btnPrimaryCls} mt-6`}>Volver al Dashboard</button>
    </div>
  )

  if (!author) return (
    <div className="text-center py-20">
      <User className="w-16 h-16 mx-auto text-surface-300" />
      <p className="mt-4 text-surface-500 font-medium">Autor no encontrado</p>
      <button onClick={() => router.push("/")} className={`${btnPrimaryCls} mt-6`}>Volver al Dashboard</button>
    </div>
  )

  return (
    <div className="space-y-8">
      <button onClick={() => router.push("/")} className={`${btnSecondaryCls} w-fit`}>
        <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
      </button>

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

      <div className={`${cardCls} overflow-hidden`}>
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-violet-500 p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold shadow-lg">
                {author.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{author.name}</h1>
                <p className="mt-1 text-white/70">{author.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(!editing); setError(""); setSuccessMsg("") }}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-1.5">
                <Pencil className="w-4 h-4" /> {editing ? "Cancelar" : "Editar"}
              </button>
              <button onClick={handleDeleteAuthor}
                className="px-4 py-2 bg-red-500/80 backdrop-blur-sm text-white rounded-xl hover:bg-red-500 transition-all flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
            <Globe className="w-5 h-5 text-primary-500" />
            <div>
              <p className="text-xs text-surface-500">Nacionalidad</p>
              <p className="font-medium text-surface-800">{author.nationality || "No especificada"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
            <Calendar className="w-5 h-5 text-primary-500" />
            <div>
              <p className="text-xs text-surface-500">Año de nacimiento</p>
              <p className="font-medium text-surface-800">{author.birthYear || "No especificado"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
            <BookOpen className="w-5 h-5 text-primary-500" />
            <div>
              <p className="text-xs text-surface-500">Libros publicados</p>
              <p className="font-medium text-surface-800">{author._count.books} libro{author._count.books !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
        {author.bio && <div className="px-6 pb-6"><p className="text-sm text-surface-600 italic leading-relaxed">{author.bio}</p></div>}

        {editing && (
          <div className="border-t border-surface-100 p-6 bg-surface-50/50">
            <form onSubmit={handleUpdateAuthor} className="space-y-5 max-w-2xl">
              <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                <Pencil className="w-5 h-5" /> Editar información
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Nombre *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Nacionalidad</label>
                  <input type="text" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Año de nacimiento</label>
                  <input type="number" value={form.birthYear} onChange={e => setForm({ ...form, birthYear: e.target.value })} className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Biografía</label>
                  <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className={inputCls} />
                </div>
              </div>
              <button type="submit" className={btnPrimaryCls}><Pencil className="w-4 h-4" /> Guardar Cambios</button>
            </form>
          </div>
        )}
      </div>

      {stats && (
        <div className={`${cardCls} p-6 sm:p-8`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-surface-900">Estadísticas</h2>
              <p className="text-sm text-surface-500">Datos y métricas del autor</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200/50">
              <BookOpen className="w-5 h-5 text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-primary-700">{stats.totalBooks}</p>
              <p className="text-sm text-primary-600 font-medium mt-1">Total Libros</p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50">
              <BarChart3 className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="text-3xl font-bold text-emerald-700">{stats.averagePages ?? "—"}</p>
              <p className="text-sm text-emerald-600 font-medium mt-1">Promedio pág.</p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50">
              <TrendingDown className="w-5 h-5 text-amber-600 mb-2" />
              <p className="font-bold text-amber-700 truncate">{stats.firstBook?.title ?? "—"}</p>
              <p className="text-sm text-amber-600 font-medium mt-1">Primer libro ({stats.firstBook?.year ?? "?"})</p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/50">
              <TrendingUp className="w-5 h-5 text-rose-600 mb-2" />
              <p className="font-bold text-rose-700 truncate">{stats.latestBook?.title ?? "—"}</p>
              <p className="text-sm text-rose-600 font-medium mt-1">Último libro ({stats.latestBook?.year ?? "?"})</p>
            </div>
          </div>
          {stats.genres.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-surface-700 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Géneros literarios
              </p>
              <div className="flex flex-wrap gap-2">
                {stats.genres.map(g => (
                  <span key={g} className="px-4 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-sm font-medium border border-primary-200/50">{g}</span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.longestBook && (
              <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50">
                <p className="text-sm font-semibold text-indigo-700 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Más páginas</p>
                <p className="font-bold text-indigo-900 mt-1">{stats.longestBook.title}</p>
                <p className="text-sm text-indigo-600">{stats.longestBook.pages ?? "?"} páginas</p>
              </div>
            )}
            {stats.shortestBook && (
              <div className="p-5 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-200/50">
                <p className="text-sm font-semibold text-pink-700 flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> Menos páginas</p>
                <p className="font-bold text-pink-900 mt-1">{stats.shortestBook.title}</p>
                <p className="text-sm text-pink-600">{stats.shortestBook.pages ?? "?"} páginas</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`${cardCls} overflow-hidden`}>
        <div className="p-6 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-600">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Libros</h2>
              <p className="text-sm text-surface-500">{author.books.length} libro{author.books.length !== 1 ? "s" : ""} de {author.name}</p>
            </div>
          </div>
          <button onClick={() => { setShowBookForm(!showBookForm); setError(""); setSuccessMsg("") }} className={btnPrimaryCls}>
            {showBookForm ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Agregar Libro</>}
          </button>
        </div>

        {showBookForm && (
          <form onSubmit={handleAddBook} className="p-6 border-b bg-gradient-to-r from-surface-50 to-primary-50 space-y-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white"><BookOpen className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-surface-900">Nuevo libro para {author.name}</h3>
                <p className="text-sm text-surface-500">Completa los datos del libro</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Título *</label>
                <input type="text" required value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} className={inputCls} placeholder="Ej: Cien años de soledad" />
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
                <textarea rows={2} value={bookForm.description} onChange={e => setBookForm({ ...bookForm, description: e.target.value })} className={inputCls} placeholder="Breve descripción..." />
              </div>
            </div>
            <button type="submit" className={btnPrimaryCls}><Plus className="w-4 h-4" /> Crear Libro</button>
          </form>
        )}

        {author.books.length === 0 ? (
          <div className="p-16 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-surface-300" />
            <p className="mt-4 text-surface-500 font-medium">No hay libros registrados</p>
            <p className="mt-1 text-sm text-surface-400">Agrega el primer libro de este autor</p>
            <button onClick={() => setShowBookForm(true)} className={`${btnPrimaryCls} mt-6 mx-auto`}>
              <Plus className="w-4 h-4" /> Agregar Primer Libro
            </button>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {author.books.map((book) => (
              <div key={book.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-surface-50/50 transition-colors group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-surface-900 truncate">{book.title}</h3>
                      {book.genre && <span className={badgeSurfaceCls}>{book.genre}</span>}
                    </div>
                    <p className="text-sm text-surface-500 mt-0.5">
                      {book.publishedYear && `${book.publishedYear}`}
                      {book.pages && `${book.publishedYear ? " · " : ""}${book.pages} pág.`}
                    </p>
                    {book.description && <p className="text-sm text-surface-400 mt-1 line-clamp-1">{book.description}</p>}
                  </div>
                </div>
                <button onClick={() => handleDeleteBook(book.id)} className={btnDangerCls}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}