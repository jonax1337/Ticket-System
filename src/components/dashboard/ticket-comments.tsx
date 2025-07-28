'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { CommentEditor, CommentEditorRef } from '@/components/editor/comment-editor'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Send, Mail, MessageSquare, Trash2, ArrowRight, Paperclip, X, Download, Eye, Image as ImageIcon, ChevronDown, ChevronRight, Users, Check } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-system'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import CommentContent from './comment-content'
import { CommentToolbar } from './comment-toolbar'
import { UserAvatar } from '@/components/ui/user-avatar'
import { CustomerAvatar } from '@/components/ui/customer-avatar'
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


interface Comment {
  id: string
  content: string
  fullEmailContent?: string | null // Full email content including history for email replies
  sentToEmails?: string | null // Comma-separated emails this external comment was sent to
  createdAt: Date
  // type ist nicht in der Datenbank, wir leiten es aus dem Content ab
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
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
  participants?: {
    id: string
    email: string
    name?: string | null
    type: string
  }[]
  fromEmail: string
  fromName: string | null
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
  const router = useRouter()
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'internal' | 'external'>('internal')
  const [isLoading, setIsLoading] = useState(false)
  const [nextStatus, setNextStatus] = useState<string>(ticket.status)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [statuses, setStatuses] = useState<CustomStatus[]>([])
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [expandedEmailHistory, setExpandedEmailHistory] = useState<{[key: string]: boolean}>({})
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]) // Email addresses
  const [participants, setParticipants] = useState<{id: string, email: string, name: string | null, type: string}[]>([])
  const editorRef = useRef<CommentEditorRef>(null)

  useEffect(() => {
    // Load custom statuses, users, and participants
    const fetchData = async () => {
      try {
        const [statusResponse, usersResponse, participantsResponse] = await Promise.all([
          fetch('/api/statuses'),
          fetch('/api/users'),
          fetch(`/api/tickets/${ticket.id}/participants`)
        ])
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          setStatuses(statusData)
        }
        
        if (usersResponse.ok) {
          const userData = await usersResponse.json()
          setUsers(userData)
        }
        
        if (participantsResponse.ok) {
          const participantData = await participantsResponse.json()
          setParticipants(participantData)
          // Default select requester for external comments
          if (ticket.fromEmail) {
            setSelectedParticipants([ticket.fromEmail])
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    
    fetchData()
  }, [ticket.id, ticket.fromEmail])

  // Sync nextStatus with ticket.status when the component receives updated props
  useEffect(() => {
    setNextStatus(ticket.status)
  }, [ticket.status])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Handle editor content changes  
  const [editorSerializedState, setEditorSerializedState] = useState<unknown>(null)
  
  const handleEditorChange = (content: string, serializedState?: unknown) => {
    setNewComment(content)
    setEditorSerializedState(serializedState)
  }

  // Extract mentions from serialized editor state
  const extractMentionsFromState = (serializedState: unknown): string => {
    const state = serializedState as { root?: { children?: unknown[] } }
    if (!serializedState || !state.root || !state.root.children) {
      return newComment
    }

    let result = ''
    let isFirstParagraph = true
    
    const processNode = (node: Record<string, unknown>) => {
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
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child) => processNode(child as Record<string, unknown>))
        }
      } else if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => processNode(child as Record<string, unknown>))
      }
    }

    state.root.children.forEach((child) => processNode(child as Record<string, unknown>))
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
      
      // Check if status is changing to add status change info to comment
      const isStatusChanging = nextStatus && nextStatus !== ticket.status
      const previousStatus = ticket.status
      
      // Wenn wir einen externen Kommentar schicken, fügen wir einen Präfix für die Anzeige hinzu
      const commentContent = commentType === 'external' 
        ? `[EMAIL] ${processedComment.trim()}`
        : processedComment.trim()

      // Prepare form data for file uploads
      const formData = new FormData()
      formData.append('content', commentContent)
      formData.append('type', commentType)
      
      // Add status change information if status is changing
      if (isStatusChanging) {
        formData.append('statusChange', JSON.stringify({
          from: previousStatus,
          to: nextStatus
        }))
      }
      
      // Add selected participants for external comments
      if (commentType === 'external' && selectedParticipants.length > 0) {
        formData.append('selectedParticipants', JSON.stringify(selectedParticipants))
      }
      
      // Add files to form data
      selectedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })
      formData.append('fileCount', selectedFiles.length.toString())

      // Process comment and status change together
      const commentResponse = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        body: formData,
      })

      // Update status if needed (moved after comment to ensure proper tracking)
      let statusUpdateSuccess = true
      if (isStatusChanging) {
        try {
          const statusResponse = await fetch(`/api/tickets/${ticket.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: nextStatus }),
          })
          
          if (!statusResponse.ok) {
            statusUpdateSuccess = false
            console.error('Failed to update status')
            toast.error('Comment added but status update failed')
          }
        } catch (statusError) {
          statusUpdateSuccess = false
          console.error('Status update error:', statusError)
          toast.error('Comment added but status update failed')
        }
      }

      if (commentResponse.ok) {
        setNewComment('')
        setEditorSerializedState(null)
        // Reset nextStatus to current ticket status unless status change was successful
        if (!(isStatusChanging && statusUpdateSuccess)) {
          setNextStatus(ticket.status)
        }
        // If status change was successful, nextStatus should already be correct
        setSelectedFiles([])
        // Clear the editor using the ref
        editorRef.current?.clear()
        
        // Show appropriate success message
        if (isStatusChanging && statusUpdateSuccess) {
          toast.success(`Comment added and status changed to "${nextStatus}"`)
        } else if (isStatusChanging && !statusUpdateSuccess) {
          toast.success('Comment added (status update failed)')
        } else {
          toast.success('Comment added successfully')
        }
        
        // Refresh to show changes
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

          {/* Participant Selection for External Comments */}
          {commentType === 'external' && (
            <div className="pt-3 border-t border-border/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Send email to:
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between text-left font-normal"
                    >
                      {selectedParticipants.length === 0
                        ? "Select recipients..."
                        : `${selectedParticipants.length} recipient${selectedParticipants.length !== 1 ? 's' : ''} selected`
                      }
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search participants..." />
                      <CommandEmpty>No participants found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {/* Requester */}
                          <CommandItem
                            onSelect={() => {
                              if (selectedParticipants.includes(ticket.fromEmail)) {
                                setSelectedParticipants(prev => prev.filter(email => email !== ticket.fromEmail))
                              } else {
                                setSelectedParticipants(prev => [...prev, ticket.fromEmail])
                              }
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {selectedParticipants.includes(ticket.fromEmail) && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{ticket.fromName || ticket.fromEmail}</div>
                                {ticket.fromName && ticket.fromName !== ticket.fromEmail && (
                                  <div className="text-xs text-muted-foreground">{ticket.fromEmail}</div>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                                Requester
                              </Badge>
                            </div>
                          </CommandItem>
                          
                          {/* Other Participants */}
                          {participants.filter(p => p.email !== ticket.fromEmail).map((participant) => {
                            return (
                              <CommandItem
                                key={participant.id}
                                onSelect={() => {
                                  if (selectedParticipants.includes(participant.email)) {
                                    setSelectedParticipants(prev => prev.filter(email => email !== participant.email))
                                  } else {
                                    setSelectedParticipants(prev => [...prev, participant.email])
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  {selectedParticipants.includes(participant.email) && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                  <div className="flex-1">
                                    <div>{participant.name || participant.email}</div>
                                    {participant.name && participant.name !== participant.email && (
                                      <div className="text-xs text-muted-foreground">{participant.email}</div>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    Participant
                                  </Badge>
                                </div>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {/* Selected participants preview */}
                {selectedParticipants.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedParticipants.map((email) => {
                      const isRequester = email === ticket.fromEmail
                      const participant = participants.find(p => p.email === email)
                      const displayName = isRequester 
                        ? (ticket.fromName || ticket.fromEmail)
                        : (participant?.name || email)
                      
                      return (
                        <Badge 
                          key={email} 
                          variant="secondary" 
                          className="text-xs flex items-center gap-1"
                        >
                          {displayName}
                          <button
                            onClick={() => setSelectedParticipants(prev => prev.filter(e => e !== email))}
                            className="ml-1 hover:bg-muted rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {commentType === 'external' ? (
                  <>
                    <Mail className="h-3 w-3" />
                    <span>Will send email to {selectedParticipants.length} recipient{selectedParticipants.length !== 1 ? 's' : ''}</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-3 w-3" />
                    <span>Only visible internally</span>
                  </>
                )}
              </div>
              
              {nextStatus && nextStatus !== ticket.status && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <ArrowRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-700 dark:text-blue-300 font-medium">
                    Status will change to &quot;{nextStatus}&quot;
                  </span>
                </div>
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
                  {comment.user ? (
                    <UserAvatar 
                      user={{
                        name: comment.user.name,
                        email: comment.user.email,
                        avatarUrl: comment.user.avatarUrl
                      }}
                      size="sm"
                    />
                  ) : (
                    <CustomerAvatar 
                      name={comment.fromName}
                      email={comment.fromEmail || 'unknown@example.com'}
                      size="sm"
                    />
                  )}
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
                  
                  <div className="text-xs text-muted-foreground ml-auto text-right">
                    <div>{format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}</div>
                    {comment.sentToEmails && (
                      <div className="text-xs text-muted-foreground opacity-70">
                        Sent to: {comment.sentToEmails.split(', ').length > 2 
                          ? `${comment.sentToEmails.split(', ').slice(0, 2).join(', ')} +${comment.sentToEmails.split(', ').length - 2} more`
                          : comment.sentToEmails
                        }
                      </div>
                    )}
                    {comment.fromEmail && (
                      <div className="text-xs text-muted-foreground opacity-70">
                        From: {comment.fromEmail}
                      </div>
                    )}
                  </div>
                  
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
                  {(() => {
                    let contentToDisplay = comment.content
                    let statusChangeInfo = null
                    
                    // Extract status change information if present
                    const statusChangeMatch = contentToDisplay.match(/\[STATUS_CHANGE\] Status changed from "([^"]+)" to "([^"]+)"/)
                    if (statusChangeMatch) {
                      statusChangeInfo = {
                        from: statusChangeMatch[1],
                        to: statusChangeMatch[2]
                      }
                      // Remove status change info from main content
                      contentToDisplay = contentToDisplay.replace(/\[STATUS_CHANGE\] Status changed from "[^"]+" to "[^"]+"/, '').trim()
                    }
                    
                    // Clean content based on type
                    if (contentToDisplay.startsWith('[EMAIL REPLY]')) {
                      contentToDisplay = contentToDisplay.substring(13) // Remove '[EMAIL REPLY] '
                    } else if (contentToDisplay.startsWith('[EMAIL]')) {
                      contentToDisplay = contentToDisplay.substring(7) // Remove '[EMAIL] '
                    }
                    
                    // Check if this is a status change comment made via ticket details (no additional content)
                    const isStatusChangeOnly = statusChangeInfo && !contentToDisplay.trim()
                    
                    return (
                      <>
                        {/* Status Change Indicator */}
                        {statusChangeInfo && (
                          <div className={`p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md ${isStatusChangeOnly ? '' : 'mb-3'}`}>
                            <div className="flex items-center gap-2 text-sm">
                              <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-blue-800 dark:text-blue-200">Status changed</span>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const fromStatus = statuses.find(s => s.name === statusChangeInfo.from)
                                  const FromIcon = fromStatus ? getIconComponent(fromStatus.icon) : () => null
                                  return (
                                    <Badge variant="outline" className={fromStatus?.color || 'bg-gray-100 text-gray-700 border-gray-300'}>
                                      {fromStatus && <FromIcon className="h-3 w-3 mr-1" />}
                                      {statusChangeInfo.from}
                                    </Badge>
                                  )
                                })()}
                                <ArrowRight className="h-3 w-3 text-gray-500" />
                                {(() => {
                                  const toStatus = statuses.find(s => s.name === statusChangeInfo.to)
                                  const ToIcon = toStatus ? getIconComponent(toStatus.icon) : () => null
                                  return (
                                    <Badge variant="outline" className={toStatus?.color || 'bg-blue-100 text-blue-700 border-blue-300'}>
                                      {toStatus && <ToIcon className="h-3 w-3 mr-1" />}
                                      {statusChangeInfo.to}
                                    </Badge>
                                  )
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Regular Comment Content - Hide if it's only a status change from ticket details */}
                        {contentToDisplay.trim() && !isStatusChangeOnly && (
                          <CommentContent content={contentToDisplay.trim()} />
                        )}
                      </>
                    )
                  })()}
                  
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