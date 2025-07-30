'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WikiEditor, WikiEditorRef } from './wiki-editor'
import { WikiPermissionsDialog } from './wiki-permissions-dialog'
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  Settings,
  Clock,
  CheckCircle,
  Archive
} from 'lucide-react'
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

interface WikiEditPageProps {
  article: WikiArticle
  users: User[]
  currentUser: {
    id: string
    name?: string | null
    email?: string | null
    role?: string
  }
}

const statusOptions = [
  { value: 'DRAFT', label: 'Draft', icon: Clock, color: 'bg-gray-100 text-gray-800' },
  { value: 'REVIEW', label: 'Under Review', icon: Eye, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PUBLISHED', label: 'Published', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'ARCHIVED', label: 'Archived', icon: Archive, color: 'bg-red-100 text-red-800' },
]

export function WikiEditPage({ article, users, currentUser }: WikiEditPageProps) {
  const [title, setTitle] = useState(article.title)
  const [content, setContent] = useState(article.content)
  const [status, setStatus] = useState(article.status)
  const [isSaving, setIsSaving] = useState(false)
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const editorRef = useRef<WikiEditorRef>(null)
  const router = useRouter()

  // Track changes
  useEffect(() => {
    const hasChanges = 
      title !== article.title || 
      content !== article.content || 
      status !== article.status
    setHasUnsavedChanges(hasChanges)
  }, [title, content, status, article])

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Article title is required')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/wiki/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
          status
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update article')
      }

      toast.success('Article saved successfully')
      setHasUnsavedChanges(false)
      
      // Refresh the page to get updated data
      router.refresh()
    } catch (error) {
      console.error('Error saving article:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save article')
    } finally {
      setIsSaving(false)
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
  }

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/dashboard/wiki')
      }
    } else {
      router.push('/dashboard/wiki')
    }
  }

  const handlePreview = () => {
    router.push(`/dashboard/wiki/${article.slug}`)
  }

  const currentStatus = statusOptions.find(opt => opt.value === status)
  const canManagePermissions = 
    article.author.id === currentUser.id ||
    currentUser.role === 'ADMIN' ||
    article.permissions.some(p => 
      p.userId === currentUser.id && p.permission === 'ADMIN'
    )

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Wiki
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Article</h1>
            <p className="text-muted-foreground">
              Last updated {new Date(article.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          {canManagePermissions && (
            <Button
              variant="outline"
              onClick={() => setIsPermissionsOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Permissions
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-3 space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle>Article Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter article title..."
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label>Content</Label>
                <WikiEditor
                  ref={editorRef}
                  value={content}
                  onChange={handleContentChange}
                  users={users}
                  disabled={isSaving}
                  className="min-h-[400px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={isSaving}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {currentStatus && (
                <Badge className={currentStatus.color}>
                  <currentStatus.icon className="h-3 w-3 mr-1" />
                  {currentStatus.label}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Article Info */}
          <Card>
            <CardHeader>
              <CardTitle>Article Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Author</Label>
                <p>{article.author.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p>{new Date(article.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Last Modified</Label>
                <p>{new Date(article.updatedAt).toLocaleDateString()}</p>
              </div>
              {article.publishedAt && (
                <div>
                  <Label className="text-xs text-muted-foreground">Published</Label>
                  <p>{new Date(article.publishedAt).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Slug</Label>
                <p className="font-mono text-xs">{article.slug}</p>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Summary */}
          {article.permissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {article.permissions.length} permission(s) set
                </p>
                {canManagePermissions && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPermissionsOpen(true)}
                    className="w-full"
                  >
                    Manage Permissions
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Permissions Dialog */}
      {canManagePermissions && (
        <WikiPermissionsDialog
          isOpen={isPermissionsOpen}
          onClose={() => setIsPermissionsOpen(false)}
          articleId={article.id}
          users={users}
        />
      )}
    </div>
  )
}