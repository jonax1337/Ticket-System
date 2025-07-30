import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WikiViewPage } from '@/components/wiki/wiki-view-page'

interface PageProps {
  params: { slug: string }
}

export default async function ViewWikiArticle({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Get the article by slug with permissions
  const article = await prisma.wikiArticle.findUnique({
    where: { slug: params.slug },
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
    redirect('/dashboard/wiki')
  }

  // Check view permissions
  const canView = 
    article.authorId === session.user.id ||
    session.user.role === 'ADMIN' ||
    article.permissions.some(p => 
      p.userId === session.user.id && p.permission === 'VIEW'
    ) ||
    article.permissions.some(p => 
      p.role === session.user.role && p.permission === 'VIEW'
    ) ||
    (article.permissions.length === 0 && article.status === 'PUBLISHED')

  if (!canView) {
    redirect('/dashboard/wiki')
  }

  // Check edit permissions
  const canEdit = 
    article.authorId === session.user.id ||
    session.user.role === 'ADMIN' ||
    article.permissions.some(p => 
      p.userId === session.user.id && (p.permission === 'EDIT' || p.permission === 'ADMIN')
    ) ||
    article.permissions.some(p => 
      p.role === session.user.role && (p.permission === 'EDIT' || p.permission === 'ADMIN')
    )

  return (
    <WikiViewPage 
      article={article}
      canEdit={canEdit}
      currentUser={session.user}
    />
  )
}