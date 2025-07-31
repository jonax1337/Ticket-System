import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WikiEditPage } from '@/components/wiki/wiki-edit-page'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditWikiArticle({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  const { id } = await params

  // Get the article with permissions
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

  if (!canEdit) {
    redirect('/dashboard/wiki')
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

  return (
    <WikiEditPage 
      article={{
        ...article,
        publishedAt: article.publishedAt?.toISOString() || null,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString()
      }}
      users={users}
      currentUser={session.user}
    />
  )
}