import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WikiDashboard } from '@/components/wiki/wiki-dashboard'

export default async function WikiPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Get all users for mention functionality
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' }
  })

  // Get user's accessible articles
  const articles = await prisma.wikiArticle.findMany({
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
    orderBy: { updatedAt: 'desc' }
  })

  // Filter articles based on permissions and convert dates to strings
  const accessibleArticles = articles
    .filter(article => {
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
    .map(article => ({
      ...article,
      publishedAt: article.publishedAt?.toISOString() || null,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      permissions: article.permissions.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString()
      }))
    }))

  return (
    <WikiDashboard 
      articles={accessibleArticles}
      users={users}
    />
  )
}