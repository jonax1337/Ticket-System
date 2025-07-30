'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WikiEditor, WikiEditorRef } from './wiki-editor'

interface User {
  id: string
  name: string
  email: string
}

interface WikiCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (title: string, content: string) => Promise<void>
  users: User[]
}

export function WikiCreateDialog({
  isOpen,
  onClose,
  onSubmit,
  users
}: WikiCreateDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const editorRef = useRef<WikiEditorRef>(null)

  const handleSubmit = async () => {
    if (!title.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(title.trim(), content)
      
      // Reset form
      setTitle('')
      setContent('')
      editorRef.current?.clear()
    } catch {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('')
      setContent('')
      editorRef.current?.clear()
      onClose()
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Wiki Article</DialogTitle>
          <DialogDescription>
            Create a new article for your knowledge base. You can edit and publish it later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter article title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2 flex-1 flex flex-col min-h-0">
            <Label>Content</Label>
            <div className="flex-1 min-h-0">
              <WikiEditor
                ref={editorRef}
                placeholder="Start writing your article content..."
                onChange={handleContentChange}
                users={users}
                disabled={isSubmitting}
                autoFocus
                className="h-full"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Article'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}