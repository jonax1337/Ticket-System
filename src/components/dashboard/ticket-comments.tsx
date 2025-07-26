'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CommentEditor, CommentEditorRef } from '@/components/editor/comment-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Send, Mail, MessageSquare, Trash2, ArrowRight, AlertCircle, CheckCircle2, Clock, Timer, AlertTriangle, Zap, TrendingUp, Paperclip, X, Download, Eye, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import CommentContent from './comment-content'
import { CommentToolbar } from './comment-toolbar'
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
  fullEmailContent?: string | null // Full email content including history for email replies
  createdAt: Date
  // type ist nicht in der Datenbank, wir leiten es aus dem Content ab
  user: {
    id: string
    name: string
    email: string
  } | null // Can be null for external email replies
  fromName?: string | null // Name of external user for email replies
  fromEmail?: string | null // Email of external user for email replies
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
  onTicketUpdate?: (updatedTicket: any) => void
}

export default function TicketComments({ ticket, currentUser, onTicketUpdate }: TicketCommentsProps) {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>(ticket.comments || [])
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'internal' | 'external'>('internal')
  const [isLoading, setIsLoading] = useState(false)
  const [nextStatus, setNextStatus] = useState<string>(ticket.status)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState<{url: string, type: string, name: string} | null>(null)
  const [statuses, setStatuses] = useState<CustomStatus[]>([])
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [expandedEmailHistory, setExpandedEmailHistory] = useState<{[key: string]: boolean}>({})
  const editorRef = useRef<CommentEditorRef>(null)

  useEffect(() => {
    // Load custom statuses and users
    const fetchData = async () => {
      try {
        const [statusResponse, usersResponse] = await Promise.all([
          fetch('/api/statuses'),
          fetch('/api/users')
        ])
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          setStatuses(statusData)
        }
        
        if (usersResponse.ok) {
          const userData = await usersResponse.json()
          setUsers(userData)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    
    fetchData()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Handle editor content changes  
  const [editorSerializedState, setEditorSerializedState] = useState<any>(null)
  
  const handleEditorChange = (content: string, serializedState?: any) => {
    setNewComment(content)
    setEditorSerializedState(serializedState)
  }

  // Extract mentions from serialized editor state
  const extractMentionsFromState = (serializedState: any): string => {
    if (!serializedState || !serializedState.root || !serializedState.root.children) {
      return newComment
    }

    let result = ''
    let isFirstParagraph = true
    
    const processNode = (node: any) => {
      if (node.type === 'mention') {
        // Convert mention node to our storage format
        result += `@[${node.mentionName}](${node.mentionId || node.mentionName})`
      } else if (node.type === 'text') {
        result += node.text
      } else if (node.type === 'linebreak') {
        // Add line break for Shift+Enter
        result += '\n'
      } else if (node.type === 'paragraph') {
        // Add newline before each paragraph except the first one
        if (!isFirstParagraph) {
          result += '\n'
        }
        isFirstParagraph = false
        // Process children of paragraph
        if (node.children) {
          node.children.forEach(processNode)
        }
      } else if (node.children) {
        node.children.forEach(processNode)
      }
    }

    serializedState.root.children.forEach(processNode)
    return result || newComment
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

  // Function to extract email history from full email content
  const extractEmailHistory = (fullEmailContent: string, newContent: string) => {
    if (!fullEmailContent || !newContent) return null
    
    // Find where the new content ends and the email history begins
    const newContentTrimmed = newContent.replace('[EMAIL REPLY] ', '').trim()
    const fullContentTrimmed = fullEmailContent.trim()
    
    // If the new content is at the beginning, everything after it is history
    if (fullContentTrimmed.startsWith(newContentTrimmed)) {
      const historyStart = newContentTrimmed.length
      const emailHistory = fullContentTrimmed.substring(historyStart).trim()
      return emailHistory.length > 0 ? emailHistory : null
    }
    
    // If we can't find a clear separation, return the difference
    if (fullContentTrimmed.length > newContentTrimmed.length) {
      return fullContentTrimmed.substring(newContentTrimmed.length).trim()
    }
    
    return null
  }

  const toggleEmailHistory = (commentId: string) => {
    setExpandedEmailHistory(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
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
      // Extract proper mention format from editor state
      const processedComment = extractMentionsFromState(editorSerializedState)
      
      // Wenn wir einen externen Kommentar schicken, fügen wir einen Präfix für die Anzeige hinzu
      const commentContent = commentType === 'external' 
        ? `[EMAIL] ${processedComment.trim()}`
        : processedComment.trim()

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

      // Then update status if selected and different from current
      if (nextStatus && nextStatus !== ticket.status) {
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
        setEditorSerializedState(null)
        setNextStatus(ticket.status)
        setSelectedFiles([])
        // Clear the editor using the ref
        editorRef.current?.clear()
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
    <div className="space-y-6">
      {/* Comment Input Form - Always at the top */}
      <form onSubmit={handleSubmitComment} className="bg-card border rounded-md shadow-sm overflow-hidden">
        <CommentToolbar
          commentType={commentType}
          onCommentTypeChange={setCommentType}
          nextStatus={nextStatus}
          onNextStatusChange={setNextStatus}
          statuses={statuses}
          currentTicketStatus={ticket.status}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          disabled={isLoading}
        />
        
        <div className="p-4 space-y-3">
          <CommentEditor
            ref={editorRef}
            value={newComment}
            onChange={handleEditorChange}
            placeholder="Add a comment... (use @username to mention someone)"
            disabled={isLoading}
            users={users.filter(user => user.id !== currentUser.id)}
            className="min-h-[100px]"
          />
          
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

          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">
              {commentType === 'external' ? "Will send email to requester" : "Only visible internally"}
              {nextStatus && nextStatus !== ticket.status && (
                <span className="ml-2">• Status will change to "{nextStatus}"</span>
              )}
            </div>
            
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

      {/* Comments List - Newest first, no container scrolling */}
      <div>
        {ticket.comments.length === 0 ? (
          <div className="bg-muted/30 rounded-md flex items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">
              No comments yet. Be the first to add one!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reverse the comments array to show newest first */}
            {[...ticket.comments].reverse().map((comment) => (
              <div key={comment.id} className="bg-muted/30 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                  <div className="bg-primary/10 text-primary rounded-full p-1">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">
                    {comment.user ? comment.user.name : (comment.fromName || 'External User')}
                  </span>
                  
                  {/* Check for email types and display appropriate badges */}
                  {(() => {
                    const isEmailReply = comment.content.startsWith('[EMAIL REPLY]')
                    const isEmail = comment.content.startsWith('[EMAIL]')
                    const isEmailType = isEmailReply || isEmail
                    
                    return (
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={isEmailType
                            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800'}
                        >
                          <span className="flex items-center gap-1 text-xs">
                            {isEmailType ? (
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
                        
                        {isEmailReply && (
                          <Badge 
                            variant="secondary"
                            className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                          >
                            <span className="flex items-center gap-1 text-xs">
                              <Mail className="h-3 w-3" />
                              <span>via Mail</span>
                            </span>
                          </Badge>
                        )}
                      </div>
                    )
                  })()}
                  
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                  </span>
                  
                  {comment.user && currentUser.id === comment.user.id && (
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
                <div className="text-sm">
                  <CommentContent 
                    content={(() => {
                      if (comment.content.startsWith('[EMAIL REPLY]')) {
                        return comment.content.substring(13) // Entferne '[EMAIL REPLY] '
                      } else if (comment.content.startsWith('[EMAIL]')) {
                        return comment.content.substring(7) // Entferne '[EMAIL] '
                      }
                      return comment.content
                    })()}
                  />
                  
                  {/* Email History Section for Email Replies */}
                  {comment.content.startsWith('[EMAIL REPLY]') && comment.fullEmailContent && (() => {
                    const cleanedContent = comment.content.substring(13) // Remove '[EMAIL REPLY] '
                    const emailHistory = extractEmailHistory(comment.fullEmailContent, cleanedContent)
                    
                    if (!emailHistory) return null
                    
                    const isExpanded = expandedEmailHistory[comment.id] || false
                    
                    return (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => toggleEmailHistory(comment.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 mr-1" />
                          ) : (
                            <ChevronRight className="h-3 w-3 mr-1" />
                          )}
                          {isExpanded ? 'Hide' : 'Show'} Mail History
                        </Button>
                        
                        {isExpanded && (
                          <div className="mt-2 p-3 bg-muted/30 rounded border-l-2 border-blue-200 dark:border-blue-700">
                            <div className="text-xs text-muted-foreground mb-2 font-medium">
                              Original Message:
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                              {emailHistory}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
                
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
    </div>
  )
}