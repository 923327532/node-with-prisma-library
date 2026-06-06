"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, BookOpen, UserPlus, Pencil, Trash2, X, CheckCircle2, AlertCircle, Eye, BarChart3 } from "lucide-react"

interface Author {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  _count: { books: number }
  books: { id: string; title: string }[]
}

export default function Dashboard() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", bio: "", nationality: "", birthYear: "" })
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState("")

  const fetchAuthors = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/authors")
      const data = await res.json()
      setAuthors(data)
    } catch {
      setError("Error al cargar autores")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAuthors() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")
    try {
      const url = editingId ? `/api/authors/${editingId}` : "/api/authors"
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al guardar")
      }
      setSuccessMsg(editingId ? "Autor actualizado exitosamente" : "Autor creado exitosamente")
      setShowForm(false)
      setEditingId(null)
      setForm({ name: "", email: "", bio: "", nationality: "", birthYear: "" })
      fetchAuthors()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    setError("")
    setSuccessMsg("")
    if (!confirm("¿Estás seguro de eliminar este autor? Esta acción no se puede deshacer.")) return
    try {
      const res = await fetch(`/api/authors/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      setSuccessMsg("Autor eliminado correctamente")
      fetchAuthors()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (author: Author) => {
    setEditingId(author.id)
    setForm({
      name: author.name,
      email: author.email,
      bio: author.bio || "",
      nationality: author.nationality || "",
      birthYear: author.birthYear?.toString() || "",
    })
    setShowForm(true)
    setError("")
    setSuccessMsg("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const totalAuthors = authors.length
  const totalBooks = authors.reduce((sum, a) => sum + a._count.books, 0)
  const withBooks = authors.filter(a => a._count.books > 0).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-surface-900">Dashboard</h1>
          <p className="mt-1 text-surface-500">Gestiona autores y libros de la biblioteca</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: "", email: "", bio: "", nationality: "", birthYear: "" }); setError(""); setSuccessMsg("") }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-surface-800 to-surface-700 text-white font-medium rounded-xl hover:from-surface-900 hover:to-surface-800 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
        >
          {showForm ? (
            <><X className="w-4 h-4" /> Cancelar</>
          ) : (
            <><UserPlus className="w-4 h-4" /> Nuevo Autor</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <Users className="w-6 h-6 text-primary-100 mb-2" />
          <p className="text-3xl font-bold">{totalAuthors}</p>
          <p className="mt-1 text-primary-100 text-sm font-medium">Autores Registrados</p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <BookOpen className="w-6 h-6 text-emerald-100 mb-2" />
          <p className="text-3xl font-bold">{totalBooks}</p>
          <p className="mt-1 text-emerald-100 text-sm font-medium">Libros Totales</p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <BarChart3 className="w-6 h-6 text-violet-100 mb-2" />
          <p className="text-3xl font-bold">{withBooks}</p>
          <p className="mt-1 text-violet-100 text-sm font-medium">Autores con Libros</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="ml-auto text-emerald-400 hover:text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg shadow-primary-500/5 border border-surface-200/50 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white">
              {editingId ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-surface-900">{editingId ? "Editar Autor" : "Nuevo Autor"}</h2>
              <p className="text-sm text-surface-500">{editingId ? "Actualiza los datos del autor" : "Ingresa los datos del nuevo autor"}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Nombre completo *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200 text-surface-800 placeholder-surface-400" placeholder="Ej: Gabriel García Márquez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Correo electrónico *</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200 text-surface-800 placeholder-surface-400" placeholder="ej: autor@ejemplo.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Nacionalidad</label>
                <input type="text" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200 text-surface-800 placeholder-surface-400" placeholder="Ej: Colombiana" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Año de nacimiento</label>
                <input type="number" value={form.birthYear} onChange={e => setForm({ ...form, birthYear: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200 text-surface-800 placeholder-surface-400" placeholder="Ej: 1927" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Biografía</label>
                <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200 text-surface-800 placeholder-surface-400" placeholder="Breve biografía del autor..." />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-surface-800 to-surface-700 text-white font-medium rounded-xl hover:from-surface-900 hover:to-surface-800 hover:shadow-lg active:scale-[0.98] transition-all duration-200">
                {editingId ? <><Pencil className="w-4 h-4" /> Guardar Cambios</> : <><UserPlus className="w-4 h-4" /> Crear Autor</>}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-surface-700 font-medium border border-surface-200 rounded-xl hover:bg-surface-50 hover:border-surface-300 hover:shadow-sm active:scale-[0.98] transition-all duration-200">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg shadow-primary-500/5 border border-surface-200/50 overflow-hidden">
        <div className="p-6 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Autores</h2>
              <p className="text-sm text-surface-500">{authors.length} autor{authors.length !== 1 ? "es" : ""} registrado{authors.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="space-y-2">
                  <div className="animate-pulse bg-surface-200 rounded-xl h-5 w-48" />
                  <div className="animate-pulse bg-surface-200 rounded-xl h-4 w-32" />
                </div>
                <div className="flex gap-2">
                  <div className="animate-pulse bg-surface-200 rounded-xl h-9 w-16" />
                  <div className="animate-pulse bg-surface-200 rounded-xl h-9 w-16" />
                  <div className="animate-pulse bg-surface-200 rounded-xl h-9 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : authors.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-16 h-16 mx-auto text-surface-300" />
            <p className="mt-4 text-surface-500 font-medium">No hay autores registrados</p>
            <p className="mt-1 text-sm text-surface-400">Crea tu primer autor para empezar</p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-surface-800 to-surface-700 text-white font-medium rounded-xl hover:from-surface-900 hover:to-surface-800 hover:shadow-lg active:scale-[0.98] transition-all duration-200 mt-6">
              <UserPlus className="w-4 h-4" /> Crear Primer Autor
            </button>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {authors.map((author) => (
              <div key={author.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-surface-50/50 transition-colors group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {author.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-surface-900 truncate">{author.name}</h3>
                      {author._count.books > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 shrink-0">
                          <BookOpen className="w-3 h-3" /> {author._count.books}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-surface-500 truncate">{author.email}</p>
                    {author.nationality && (
                      <p className="text-xs text-surface-400 mt-0.5">{author.nationality}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/authors/${author.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-white text-surface-700 font-medium border border-surface-200 rounded-xl hover:bg-surface-50 hover:border-surface-300 hover:shadow-sm active:scale-[0.98] transition-all duration-200 text-sm">
                    <Eye className="w-4 h-4" /> Ver
                  </Link>
                  <button onClick={() => handleEdit(author)}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-yellow-600 hover:shadow-lg active:scale-[0.98] transition-all duration-200 text-sm">
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => handleDelete(author.id)}
                    className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium rounded-xl hover:from-red-600 hover:to-rose-600 hover:shadow-lg active:scale-[0.98] transition-all duration-200 text-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}