import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WikiStatus } from "@prisma/client"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/wiki/articles/[id] - Get single article
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const article = await prisma.wikiArticle.findUnique({
      where: { id },
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
        attachments: true
      }
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Check permissions
    const canView = checkViewPermission(article, session.user)
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(article)

  } catch (error) {
    console.error("Error fetching wiki article:", error)
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    )
  }
}

// PUT /api/wiki/articles/[id] - Update article
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, status } = body
    const { id } = await params

    // Get existing article
    const existingArticle = await prisma.wikiArticle.findUnique({
      where: { id },
      include: { permissions: true }
    })

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Check edit permissions
    const canEdit = checkEditPermission(existingArticle, session.user)
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update data
    const updateData: Record<string, unknown> = {}
    if (title) updateData.title = title
    if (content) updateData.content = content
    if (status) {
      updateData.status = status as WikiStatus
      if (status === "PUBLISHED" && existingArticle.status !== "PUBLISHED") {
        updateData.publishedAt = new Date()
      }
    }

    const updatedArticle = await prisma.wikiArticle.update({
      where: { id },
      data: updateData,
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
        }
      }
    })

    return NextResponse.json(updatedArticle)

  } catch (error) {
    console.error("Error updating wiki article:", error)
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    )
  }
}

// DELETE /api/wiki/articles/[id] - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get existing article
    const existingArticle = await prisma.wikiArticle.findUnique({
      where: { id },
      include: { permissions: true }
    })

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Check delete permissions (author or admin)
    const canDelete = existingArticle.authorId === session.user.id || 
                     session.user.role === 'ADMIN' ||
                     checkAdminPermission(existingArticle, session.user)
    
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete article (cascades to permissions and attachments)
    await prisma.wikiArticle.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Article deleted successfully" })

  } catch (error) {
    console.error("Error deleting wiki article:", error)
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    )
  }
}

// Helper functions for permission checking
function checkViewPermission(article: { authorId: string; permissions: { userId: string | null; role: string | null; permission: string }[]; status: string }, user: { id: string; role: string }): boolean {
  // Author can always view
  if (article.authorId === user.id) return true
  
  // Check explicit permissions
  const hasUserPermission = article.permissions.some((p) => 
    p.userId === user.id && p.permission === 'VIEW'
  )
  
  const hasRolePermission = article.permissions.some((p) => 
    p.role === user.role && p.permission === 'VIEW'
  )

  // If permissions exist, must have explicit permission
  if (article.permissions.length > 0) {
    return hasUserPermission || hasRolePermission
  }

  // If no permissions, published articles are viewable
  return article.status === 'PUBLISHED'
}

function checkEditPermission(article: { authorId: string; permissions: { userId: string | null; role: string | null; permission: string }[] }, user: { id: string; role: string }): boolean {
  // Author can always edit
  if (article.authorId === user.id) return true
  
  // Check explicit edit permissions
  const hasUserEditPermission = article.permissions.some((p) => 
    p.userId === user.id && (p.permission === 'EDIT' || p.permission === 'ADMIN')
  )
  
  const hasRoleEditPermission = article.permissions.some((p) => 
    p.role === user.role && (p.permission === 'EDIT' || p.permission === 'ADMIN')
  )

  return hasUserEditPermission || hasRoleEditPermission
}

function checkAdminPermission(article: { permissions: { userId: string | null; role: string | null; permission: string }[] }, user: { id: string; role: string }): boolean {
  // Check explicit admin permissions
  const hasUserAdminPermission = article.permissions.some((p) => 
    p.userId === user.id && p.permission === 'ADMIN'
  )
  
  const hasRoleAdminPermission = article.permissions.some((p) => 
    p.role === user.role && p.permission === 'ADMIN'
  )

  return hasUserAdminPermission || hasRoleAdminPermission
}