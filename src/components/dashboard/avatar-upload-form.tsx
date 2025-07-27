'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone'
import { Upload, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface AvatarUploadFormProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    avatarUrl?: string | null
  }
  onAvatarUpdate?: (avatarUrl: string | null) => void
}

export function AvatarUploadForm({ user, onAvatarUpdate }: AvatarUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { update } = useSession()
  const router = useRouter()

  const handleFileSelect = (files: File[]) => {
    const file = files[0]
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

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleError = (error: Error) => {
    toast.error(error.message || 'Error uploading file')
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', selectedFile)

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Avatar updated successfully')
        onAvatarUpdate?.(result.avatarUrl)
        setPreview(null)
        setSelectedFile(null)
        
        // Update the session to reflect the new avatar
        await update({ avatarUrl: result.avatarUrl })
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
        setPreview(null)
        setSelectedFile(null)
        
        // Update the session to reflect the removed avatar
        await update({ avatarUrl: null })
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
    setSelectedFile(null)
  }

  return (
    <div className="space-y-6">
      {/* Current/Preview Avatar */}
      <div className="flex items-center space-x-4">
        <UserAvatar 
          user={preview ? { ...user, avatarUrl: preview } : user} 
          size="xl" 
          className="h-20 w-20"
        />
        <div>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label>Choose New Avatar</Label>
        <Dropzone
          onDrop={handleFileSelect}
          onError={handleError}
          accept={{
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
          }}
          maxSize={5 * 1024 * 1024} // 5MB
          maxFiles={1}
          disabled={isUploading}
          src={selectedFile ? [selectedFile] : undefined}
          className="min-h-[120px]"
        >
          <DropzoneEmptyState>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground mb-2">
                <Upload size={16} />
              </div>
              <p className="font-medium text-sm mb-1">
                Upload avatar image
              </p>
              <p className="text-muted-foreground text-xs">
                Drag and drop or click to upload
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                JPEG, PNG, GIF, WebP. Max 5MB.
              </p>
            </div>
          </DropzoneEmptyState>
          <DropzoneContent />
        </Dropzone>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {preview && (
          <>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Avatar'}
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
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isUploading ? 'Removing...' : 'Remove Avatar'}
          </Button>
        )}
      </div>
    </div>
  )
}