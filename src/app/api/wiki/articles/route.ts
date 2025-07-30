import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WikiStatus } from "@prisma/client"

// GET /api/wiki/articles - List articles with permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as WikiStatus | null
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: Record<string, unknown> = {}
    
    // Filter by status if provided
    if (status) {
      where.status = status
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get articles with author information
    const articles = await prisma.wikiArticle.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            attachments: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.wikiArticle.count({ where })

    // Filter articles based on permissions
    // Users can see:
    // - Articles they authored
    // - Articles with explicit VIEW permission for them
    // - Articles with VIEW permission for their role
    // - Published articles (if no explicit permissions set)
    const filteredArticles = articles.filter(article => {
      // Author can always see their own articles
      if (article.authorId === session.user.id) {
        return true
      }

      // Check explicit permissions
      const hasUserPermission = article.permissions.some(p => 
        p.userId === session.user.id && p.permission === 'VIEW'
      )
      
      const hasRolePermission = article.permissions.some(p => 
        p.role === session.user.role && p.permission === 'VIEW'
      )

      // If article has permissions set, user must have explicit permission
      if (article.permissions.length > 0) {
        return hasUserPermission || hasRolePermission
      }

      // If no permissions set, published articles are public within the organization
      return article.status === 'PUBLISHED'
    })

    return NextResponse.json({
      articles: filteredArticles,
      pagination: {
        page,
        limit,
        total: filteredArticles.length,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Error fetching wiki articles:", error)
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    )
  }
}

// POST /api/wiki/articles - Create new article
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, status = "DRAFT" } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // Generate unique slug from title
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()

    let slug = baseSlug
    let counter = 1

    // Ensure slug uniqueness
    while (await prisma.wikiArticle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create the article
    const article = await prisma.wikiArticle.create({
      data: {
        title,
        slug,
        content,
        status: status as WikiStatus,
        authorId: session.user.id,
        publishedAt: status === "PUBLISHED" ? new Date() : null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(article, { status: 201 })

  } catch (error) {
    console.error("Error creating wiki article:", error)
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    )
  }
}