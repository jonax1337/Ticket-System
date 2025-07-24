'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Send, Mail, MessageSquare, Trash2 } from 'lucide-react'
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
}

interface Ticket {
  id: string
  comments: Comment[]
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
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)

  const handleDeleteComment = async (commentId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
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

      const response = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: commentContent,
          // type wird vom Backend ignoriert, da es nicht im Schema ist
          type: commentType
        }),
      })

      if (response.ok) {
        setNewComment('')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
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
                          <AlertDialogTitle>Kommentar löschen</AlertDialogTitle>
                          <AlertDialogDescription>
                            Möchtest du diesen Kommentar wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Löschen
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
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitComment} className="mt-6 space-y-3 bg-card border rounded-md p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Select
            value={commentType}
            onValueChange={setCommentType}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[200px]">
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
          <div className="text-xs text-muted-foreground ml-2">
            {commentType === 'external' ? "Will send email to requester" : "Only visible internally"}
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            disabled={isLoading}
            className="flex-1"
          />
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
      </form>
    </div>
  )
}