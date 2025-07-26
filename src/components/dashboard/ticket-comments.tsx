'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Send, Mail, MessageSquare, Trash2, ArrowRight, AlertCircle, CheckCircle2, Clock, Timer, AlertTriangle, Zap, TrendingUp, Paperclip, X, Download, Eye, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Timer,
    AlertTriangle,
    Zap,
    TrendingUp
  }
  return iconMap[iconName] || AlertCircle
}

interface Comment {
  id: string
  content: string
  createdAt: Date
  // type ist nicht in der Datenbank, wir leiten es aus dem Content ab
  user: {
    id: string
    name: string
    email: string
  }
  attachments?: {
    id: string
    filename: string
    filepath: string
    mimetype: string
    size: number
  }[]
}

interface Ticket {
  id: string
  status: string
  comments: Comment[]
}

interface CustomStatus {
  id: string
  name: string
  icon: string
  color: string
  order: number
  isDefault: boolean
}

interface TicketCommentsProps {
  ticket: Ticket
  currentUser: {
    id: string
    name?: string | null
  }
}

export default function TicketComments({ ticket, currentUser }: TicketCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState('internal') // 'internal' or 'external'
  const [nextStatus, setNextStatus] = useState<string>('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [statuses, setStatuses] = useState<CustomStatus[]>([])
  const router = useRouter()

  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)

  useEffect(() => {
    // Load custom statuses
    const fetchStatuses = async () => {
      try {
        const response = await fetch('/api/statuses')
        if (response.ok) {
          const statusData = await response.json()
          setStatuses(statusData)
        }
      } catch (error) {
        console.error('Failed to fetch statuses:', error)
      }
    }
    
    fetchStatuses()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImage = (mimetype: string) => {
    return mimetype.startsWith('image/')
  }

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return ImageIcon
    return Paperclip
  }

  const handleDeleteComment = async (commentId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Comment deleted successfully')
        router.refresh()
      } else {
        toast.error('Failed to delete comment')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error('Failed to delete comment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsLoading(true)
    try {
      // Wenn wir einen externen Kommentar schicken, fügen wir einen Präfix für die Anzeige hinzu
      const commentContent = commentType === 'external' 
        ? `[EMAIL] ${newComment.trim()}`
        : newComment.trim()

      // Prepare form data for file uploads
      const formData = new FormData()
      formData.append('content', commentContent)
      formData.append('type', commentType)
      
      // Add files to form data
      selectedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })
      formData.append('fileCount', selectedFiles.length.toString())

      // First add the comment with attachments
      const commentResponse = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        body: formData,
      })

      // Then update status if selected
      if (nextStatus && nextStatus !== '__keep_current__' && nextStatus !== ticket.status) {
        await fetch(`/api/tickets/${ticket.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: nextStatus }),
        })
      }

      if (commentResponse.ok) {
        setNewComment('')
        setNextStatus('')
        setSelectedFiles([])
        toast.success('Comment added successfully')
        router.refresh()
      } else {
        toast.error('Failed to add comment')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        {ticket.comments.length === 0 ? (
          <div className="bg-muted/30 rounded-md flex items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">
              No comments yet. Be the first to add one!
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {ticket.comments.map((comment) => (
              <div key={comment.id} className="bg-muted/30 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                  <div className="bg-primary/10 text-primary rounded-full p-1">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">{comment.user.name}</span>
                  
                  {/* Da wir kein type-Feld in der Datenbank haben, prüfen wir auf [EMAIL] am Anfang des Kommentars */}
                  <Badge 
                    variant="outline" 
                    className={comment.content.startsWith('[EMAIL]') 
                      ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800'}
                  >
                    <span className="flex items-center gap-1 text-xs">
                      {comment.content.startsWith('[EMAIL]') ? (
                        <>
                          <Mail className="h-3 w-3" />
                          <span>Extern</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-3 w-3" />
                          <span>Intern</span>
                        </>
                      )}
                    </span>
                  </Badge>
                  
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                  </span>
                  
                  {currentUser.id === comment.user.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this comment? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {/* Entferne das [EMAIL]-Präfix, wenn vorhanden */}
                  {comment.content.startsWith('[EMAIL]') 
                    ? comment.content.substring(7) // Entferne '[EMAIL] '
                    : comment.content
                  }
                </p>
                
                {/* File attachments display */}
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      <span>Attachments ({comment.attachments.length})</span>
                    </div>

                    {/* Image attachments grid */}
                    {comment.attachments.filter(att => isImage(att.mimetype)).length > 0 && (
                      <div className="mb-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {comment.attachments
                            .filter(att => isImage(att.mimetype))
                            .map((attachment) => (
                              <Dialog key={attachment.id}>
                                <DialogTrigger asChild>
                                  <div className="relative group cursor-pointer">
                                    <img
                                      src={attachment.filepath}
                                      alt={attachment.filename}
                                      className="w-full h-20 object-cover rounded border hover:opacity-80 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                      <Eye className="h-5 w-5 text-white" />
                                    </div>
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh]">
                                  <DialogHeader>
                                    <DialogTitle>{attachment.filename}</DialogTitle>
                                  </DialogHeader>
                                  <div className="flex justify-center">
                                    <img
                                      src={attachment.filepath}
                                      alt={attachment.filename}
                                      className="max-w-full max-h-[70vh] object-contain"
                                    />
                                  </div>
                                  <div className="flex justify-between items-center pt-4">
                                    <span className="text-sm text-muted-foreground">
                                      {formatFileSize(attachment.size)}
                                    </span>
                                    <Button
                                      variant="outline"
                                      onClick={() => window.open(attachment.filepath, '_blank')}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Non-image attachments list */}
                    {comment.attachments.filter(att => !isImage(att.mimetype)).length > 0 && (
                      <div className="space-y-2">
                        {comment.attachments
                          .filter(att => !isImage(att.mimetype))
                          .map((attachment) => {
                            const FileIcon = getFileIcon(attachment.mimetype)
                            return (
                              <div key={attachment.id} className="flex items-center gap-2 bg-muted/50 rounded p-2">
                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{attachment.filename}</div>
                                  <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => window.open(attachment.filepath, '_blank')}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitComment} className="mt-6 space-y-3 bg-card border rounded-md p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Comment Type</label>
            <Select
              value={commentType}
              onValueChange={setCommentType}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Comment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Internal Comment</span>
                  </div>
                </SelectItem>
                <SelectItem value="external">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email to Requester</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              {commentType === 'external' ? "Will send email to requester" : "Only visible internally"}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Next Status (Optional)</label>
            <Select
              value={nextStatus}
              onValueChange={setNextStatus}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Keep current status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__keep_current__">
                  <span>Keep current status</span>
                </SelectItem>
                {statuses
                  .filter(status => status.name !== ticket.status)
                  .map((status) => {
                    const IconComponent = getIconComponent(status.icon)
                    return (
                      <SelectItem key={status.id} value={status.name}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{status.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              {nextStatus && nextStatus !== '__keep_current__' ? `Change status to "${nextStatus}"` : "Status will remain unchanged"}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            disabled={isLoading}
            className="min-h-[100px] resize-none"
            rows={4}
          />
          
          {/* File Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Paperclip className="h-4 w-4" />
                <span>Attach Files</span>
              </label>
              <span className="text-xs text-muted-foreground">
                Max 10MB per file. PDF, DOC, XLS, images, archives allowed.
              </span>
            </div>
            
            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Selected Files:</div>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted/50 rounded p-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => removeFile(index)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading || !newComment.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {commentType === 'external' && <Mail className="h-4 w-4" />}
              <span>{commentType === 'external' ? 'Send' : 'Comment'}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}