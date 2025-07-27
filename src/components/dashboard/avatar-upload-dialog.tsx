'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Upload, Trash2, Camera } from 'lucide-react'
import { toast } from 'sonner'

interface AvatarUploadDialogProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    avatarUrl?: string | null
  }
  onAvatarUpdate?: (avatarUrl: string | null) => void
  trigger?: React.ReactNode
}

export function AvatarUploadDialog({ user, onAvatarUpdate, trigger }: AvatarUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only images are allowed.')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Avatar updated successfully')
        onAvatarUpdate?.(result.avatarUrl)
        setIsOpen(false)
        setPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        router.refresh()
      } else {
        toast.error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    setIsUploading(true)
    try {
      const response = await fetch('/api/users/avatar', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Avatar removed successfully')
        onAvatarUpdate?.(null)
        setIsOpen(false)
        setPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        router.refresh()
      } else {
        toast.error(result.error || 'Remove failed')
      }
    } catch (error) {
      console.error('Avatar remove error:', error)
      toast.error('Remove failed')
    } finally {
      setIsUploading(false)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            Change Avatar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Avatar</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Current/Preview Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <UserAvatar 
              user={preview ? { ...user, avatarUrl: preview } : user} 
              size="xl" 
              className="h-24 w-24"
            />
            <div className="text-center">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="avatar-upload">Choose New Avatar</Label>
            <Input
              id="avatar-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {preview && (
              <>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearPreview}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </>
            )}
            
            {!preview && user.avatarUrl && (
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={isUploading}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isUploading ? 'Removing...' : 'Remove Avatar'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}