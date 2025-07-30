'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WikiArticleList } from './wiki-article-list'
import { WikiCreateDialog } from './wiki-create-dialog'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
}

interface Author {
  id: string
  name: string
  email: string
}

interface WikiArticle {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  author: Author
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  _count: {
    attachments: number
  }
}

interface WikiDashboardProps {
  articles: WikiArticle[]
  users: User[]
}

export function WikiDashboard({ articles, users }: WikiDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [articleList, setArticleList] = useState(articles)
  const router = useRouter()

  const handleCreateNew = () => {
    setIsCreateDialogOpen(true)
  }

  const handleCreateArticle = async (title: string, content: string) => {
    try {
      const response = await fetch('/api/wiki/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          status: 'DRAFT'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create article')
      }

      const newArticle = await response.json()
      
      toast.success('Article created successfully')
      setIsCreateDialogOpen(false)
      
      // Navigate to the edit page for the new article
      router.push(`/dashboard/wiki/edit/${newArticle.id}`)
    } catch (error) {
      console.error('Error creating article:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create article')
    }
  }

  const handleEdit = (articleId: string) => {
    router.push(`/dashboard/wiki/edit/${articleId}`)
  }

  const handleDelete = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/wiki/articles/${articleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete article')
      }

      toast.success('Article deleted successfully')
      
      // Remove article from list
      setArticleList(prev => prev.filter(article => article.id !== articleId))
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete article')
    }
  }

  // User can create articles if they are logged in
  const canCreate = true

  return (
    <div className="container mx-auto py-6">
      <WikiArticleList
        articles={articleList}
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canCreate={canCreate}
      />

      <WikiCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateArticle}
        users={users}
      />
    </div>
  )
}