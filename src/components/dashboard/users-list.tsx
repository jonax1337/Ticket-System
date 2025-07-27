'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { User, Mail, Trash2 } from 'lucide-react'
import { UserRole } from '@prisma/client'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/ui/user-avatar'
import { AvatarUploadDialog } from '@/components/dashboard/avatar-upload-dialog'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string | null
  createdAt: Date
  _count: {
    assignedTickets: number
    comments: number
  }
}

interface UsersListProps {
  users: User[]
  currentUserId: string
}

const roleColors = {
  ADMIN: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  SUPPORTER: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
}

export default function UsersList({ users, currentUserId }: UsersListProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      if (response.ok) {
        toast.success('User role updated successfully')
        router.refresh()
      } else {
        toast.error('Failed to update user role')
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      toast.error('Failed to update user role')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        router.refresh()
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to delete user'
        toast.error('Failed to delete user', {
          description: errorMessage
        })
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('Failed to delete user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <UserAvatar 
                  user={{
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl
                  }}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.name}</p>
                    <Badge variant="outline" className={roleColors[user.role]}>
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Joined {format(new Date(user.createdAt), 'MMM d, yyyy')} • 
                    {user._count.assignedTickets} tickets • 
                    {user._count.comments} comments
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <AvatarUploadDialog
                  user={{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl
                  }}
                  trigger={
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4" />
                    </Button>
                  }
                />
                
                <Select
                  defaultValue={user.role}
                  onValueChange={(role: UserRole) => handleRoleChange(user.id, role)}
                  disabled={isLoading || user.id === currentUserId}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPPORTER">Supporter</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                
                {user.id !== currentUserId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete user <strong>{user.name}</strong>? 
                          This action cannot be undone.
                          <br /><br />
                          <em>Note: Users with open or in-progress tickets cannot be deleted.</em>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}