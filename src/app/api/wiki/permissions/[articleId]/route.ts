import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WikiPermissionType, UserRole } from "@prisma/client"

// GET /api/wiki/permissions/[articleId] - Get article permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { articleId } = await params

    // Check if user has admin access to this article
    const article = await prisma.wikiArticle.findUnique({
      where: { id: articleId },
      include: { permissions: true }
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Only author, admins, or users with ADMIN permission can view permissions
    const canManagePermissions = 
      article.authorId === session.user.id ||
      session.user.role === 'ADMIN' ||
      article.permissions.some((p) => 
        p.userId === session.user.id && p.permission === 'ADMIN'
      )

    if (!canManagePermissions) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const permissions = await prisma.wikiPermission.findMany({
      where: { articleId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(permissions)

  } catch (error) {
    console.error("Error fetching wiki permissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    )
  }
}

// POST /api/wiki/permissions/[articleId] - Add permission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, role, permission } = body
    const { articleId } = await params

    if (!permission || (!userId && !role)) {
      return NextResponse.json(
        { error: "Permission type and either userId or role are required" },
        { status: 400 }
      )
    }

    // Check if user has admin access to this article
    const article = await prisma.wikiArticle.findUnique({
      where: { id: articleId },
      include: { permissions: true }
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    const canManagePermissions = 
      article.authorId === session.user.id ||
      session.user.role === 'ADMIN' ||
      article.permissions.some((p) => 
        p.userId === session.user.id && p.permission === 'ADMIN'
      )

    if (!canManagePermissions) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create permission
    const newPermission = await prisma.wikiPermission.create({
      data: {
        articleId,
        userId: userId || null,
        role: role as UserRole || null,
        permission: permission as WikiPermissionType
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(newPermission, { status: 201 })

  } catch (error) {
    console.error("Error creating wiki permission:", error)
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: "Permission already exists for this user/role" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create permission" },
      { status: 500 }
    )
  }
}

// DELETE /api/wiki/permissions/[articleId]/[permissionId] - Remove permission  
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const permissionId = searchParams.get("permissionId")
    const { articleId } = await params

    if (!permissionId) {
      return NextResponse.json(
        { error: "Permission ID is required" },
        { status: 400 }
      )
    }

    // Check if user has admin access to this article
    const article = await prisma.wikiArticle.findUnique({
      where: { id: articleId },
      include: { permissions: true }
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    const canManagePermissions = 
      article.authorId === session.user.id ||
      session.user.role === 'ADMIN' ||
      article.permissions.some((p) => 
        p.userId === session.user.id && p.permission === 'ADMIN'
      )

    if (!canManagePermissions) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete permission
    await prisma.wikiPermission.delete({
      where: { id: permissionId }
    })

    return NextResponse.json({ message: "Permission deleted successfully" })

  } catch (error) {
    console.error("Error deleting wiki permission:", error)
    return NextResponse.json(
      { error: "Failed to delete permission" },
      { status: 500 }
    )
  }
}