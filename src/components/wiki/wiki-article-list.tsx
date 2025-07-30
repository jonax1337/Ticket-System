'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  FileText,
  Clock,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

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

interface WikiArticleListProps {
  articles: WikiArticle[]
  onCreateNew: () => void
  onEdit: (articleId: string) => void
  onDelete: (articleId: string) => void
  canCreate?: boolean
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    case 'REVIEW':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'PUBLISHED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'ARCHIVED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <Edit className="h-3 w-3" />
    case 'REVIEW':
      return <Clock className="h-3 w-3" />
    case 'PUBLISHED':
      return <Eye className="h-3 w-3" />
    case 'ARCHIVED':
      return <FileText className="h-3 w-3" />
    default:
      return <FileText className="h-3 w-3" />
  }
}

export function WikiArticleList({
  articles: initialArticles,
  onCreateNew,
  onEdit,
  onDelete,
  canCreate = true
}: WikiArticleListProps) {
  const [articles, setArticles] = useState<WikiArticle[]>(initialArticles)
  const [filteredArticles, setFilteredArticles] = useState<WikiArticle[]>(initialArticles)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const router = useRouter()

  // Update articles when prop changes
  useEffect(() => {
    setArticles(initialArticles)
  }, [initialArticles])

  // Filter articles based on search and status
  useEffect(() => {
    let filtered = articles

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.author.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(article => article.status === statusFilter)
    }

    setFilteredArticles(filtered)
  }, [articles, searchTerm, statusFilter])

  const handleView = (slug: string) => {
    router.push(`/dashboard/wiki/${slug}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wiki Articles</h1>
          <p className="text-muted-foreground">
            Manage and organize your knowledge base
          </p>
        </div>
        {canCreate && (
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Article
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="REVIEW">Under Review</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Articles List */}
      <div className="grid gap-4">
        {filteredArticles.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Articles Found</h3>
            <p className="text-muted-foreground mb-4">
              {articles.length === 0 
                ? "No wiki articles have been created yet."
                : "No articles match your current filters."
              }
            </p>
            {canCreate && articles.length === 0 && (
              <Button onClick={onCreateNew} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Article
              </Button>
            )}
          </Card>
        ) : (
          filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1 truncate">
                      <button
                        onClick={() => handleView(article.slug)}
                        className="text-left hover:text-primary transition-colors"
                      >
                        {article.title}
                      </button>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{article.author.name}</span>
                      <span>•</span>
                      <span>
                        {article.status === 'PUBLISHED' && article.publishedAt
                          ? `Published ${formatDistanceToNow(new Date(article.publishedAt))} ago`
                          : `Updated ${formatDistanceToNow(new Date(article.updatedAt))} ago`
                        }
                      </span>
                      {article._count.attachments > 0 && (
                        <>
                          <span>•</span>
                          <span>{article._count.attachments} attachment{article._count.attachments > 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(article.status)} flex items-center gap-1`}
                    >
                      {getStatusIcon(article.status)}
                      {article.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(article.slug)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(article.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(article.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}