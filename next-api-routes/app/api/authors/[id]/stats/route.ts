import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const author = await prisma.author.findUnique({
      where: { id },
    })

    if (!author) {
      return NextResponse.json(
        { error: "Autor no encontrado" },
        { status: 404 }
      )
    }

    const books = await prisma.book.findMany({
      where: { authorId: id },
      select: {
        title: true,
        publishedYear: true,
        pages: true,
        genre: true,
      },
      orderBy: { publishedYear: "asc" },
    })

    const totalBooks = books.length

    if (totalBooks === 0) {
      return NextResponse.json({
        authorId: id,
        authorName: author.name,
        totalBooks: 0,
        firstBook: null,
        latestBook: null,
        averagePages: null,
        genres: [],
        longestBook: null,
        shortestBook: null,
      })
    }

    const firstBook = books[0]
    const latestBook = books[totalBooks - 1]

    const booksWithPages = books.filter((b) => b.pages !== null)
    const averagePages =
      booksWithPages.length > 0
        ? Math.round(
            booksWithPages.reduce((sum, b) => sum + (b.pages ?? 0), 0) /
              booksWithPages.length
          )
        : null

    const genres = [...new Set(books.map((b) => b.genre).filter(Boolean))] as string[]

    const longestBook = booksWithPages.length > 0
      ? booksWithPages.reduce((a, b) => ((a.pages ?? 0) > (b.pages ?? 0) ? a : b))
      : null

    const shortestBook = booksWithPages.length > 0
      ? booksWithPages.reduce((a, b) => ((a.pages ?? 0) < (b.pages ?? 0) ? a : b))
      : null

    return NextResponse.json({
      authorId: id,
      authorName: author.name,
      totalBooks,
      firstBook: {
        title: firstBook.title,
        year: firstBook.publishedYear,
      },
      latestBook: {
        title: latestBook.title,
        year: latestBook.publishedYear,
      },
      averagePages,
      genres,
      longestBook: longestBook
        ? { title: longestBook.title, pages: longestBook.pages }
        : null,
      shortestBook: shortestBook
        ? { title: shortestBook.title, pages: shortestBook.pages }
        : null,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas del autor" },
      { status: 500 }
    )
  }
}