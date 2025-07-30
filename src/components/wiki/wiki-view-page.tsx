'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Edit, 
  Clock,
  CheckCircle,
  Archive,
  User,
  Calendar,
  FileText
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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
  content: string
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  author: Author
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  permissions: Array<{
    id: string
    permission: string
    userId: string | null
    role: string | null
    user: User | null
  }>
  attachments: Array<{
    id: string
    filename: string
    filepath: string
    mimetype: string
    size: number
  }>
}

interface WikiViewPageProps {
  article: WikiArticle
  canEdit: boolean
  currentUser: {
    id: string
    name?: string | null
    email?: string | null
    role?: string
  }
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return { 
        icon: Edit, 
        label: 'Draft', 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        description: 'This article is in draft mode and may not be complete.'
      }
    case 'REVIEW':
      return { 
        icon: Clock, 
        label: 'Under Review', 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        description: 'This article is under review and pending approval.'
      }
    case 'PUBLISHED':
      return { 
        icon: CheckCircle, 
        label: 'Published', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        description: 'This article is published and available to authorized users.'
      }
    case 'ARCHIVED':
      return { 
        icon: Archive, 
        label: 'Archived', 
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        description: 'This article has been archived and may be outdated.'
      }
    default:
      return { 
        icon: FileText, 
        label: status, 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        description: ''
      }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function WikiViewPage({ article, canEdit }: WikiViewPageProps) {
  const router = useRouter()
  const statusInfo = getStatusInfo(article.status)

  // Simple content rendering (in a real app, you'd want to render the rich content properly)
  const renderContent = (content: string) => {
    return (
      <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert">
        {content.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/wiki')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Wiki
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              onClick={() => router.push(`/dashboard/wiki/edit/${article.id}`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Article
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {article.status !== 'PUBLISHED' && (
        <Card className="mb-6 border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <statusInfo.icon className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <article className="space-y-6">
            {/* Title and Meta */}
            <header className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>By {article.author.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {article.status === 'PUBLISHED' && article.publishedAt
                      ? `Published ${formatDistanceToNow(new Date(article.publishedAt))} ago`
                      : `Updated ${formatDistanceToNow(new Date(article.updatedAt))} ago`
                    }
                  </span>
                </div>
                <Badge className={statusInfo.color}>
                  <statusInfo.icon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>
            </header>

            <Separator />

            {/* Content */}
            <div className="min-h-[400px]">
              {renderContent(article.content)}
            </div>

            {/* Attachments */}
            {article.attachments.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                  <div className="grid gap-2">
                    {article.attachments.map((attachment) => (
                      <Card key={attachment.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{attachment.filename}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(attachment.size)} • {attachment.mimetype}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/upload/${attachment.filepath}`, '_blank')}
                            >
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </article>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Article Info */}
          <Card>
            <CardHeader>
              <CardTitle>Article Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Author</label>
                <p>{article.author.name}</p>
                <p className="text-xs text-muted-foreground">{article.author.email}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Created</label>
                <p>{new Date(article.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Last Modified</label>
                <p>{new Date(article.updatedAt).toLocaleDateString()}</p>
              </div>
              {article.publishedAt && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Published</label>
                  <p>{new Date(article.publishedAt).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Status</label>
                <Badge className={statusInfo.color}>
                  <statusInfo.icon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/wiki/edit/${article.id}`)}
                  className="w-full flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Article
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/wiki')}
                className="w-full flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Wiki
              </Button>
            </CardContent>
          </Card>

          {/* Permissions Info */}
          {article.permissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This article has restricted access with {article.permissions.length} specific permission(s) configured.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}