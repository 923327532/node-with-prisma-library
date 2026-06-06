import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get("search") || ""
    const genre = searchParams.get("genre") || ""
    const authorName = searchParams.get("authorName") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const sortBy = (searchParams.get("sortBy") || "createdAt") as string
    const order = (searchParams.get("order") || "desc") as string

    const validSortFields = ["title", "publishedYear", "createdAt"]
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt"
    const sortOrder = order === "asc" ? "asc" : "desc"

    const where: Prisma.BookWhereInput = {
      ...(search && {
        title: { contains: search, mode: "insensitive" },
      }),
      ...(genre && { genre }),
      ...(authorName && {
        author: { name: { contains: authorName, mode: "insensitive" } },
      }),
    }

    const [total, books] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Error al buscar libros" },
      { status: 500 }
    )
  }
}