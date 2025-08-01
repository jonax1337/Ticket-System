'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { 
  User, 
  Mail, 
  Trash2, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar,
  MessageCircle,
  FileText,
  Activity,
  Shield,
  UserCheck
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const roleIcons = {
  ADMIN: Shield,
  SUPPORTER: UserCheck,
}

export default function UsersList({ users, currentUserId }: UsersListProps) {
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const router = useRouter()

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchQuery === '' || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
      
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setUpdatingRole(userId)
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
      setUpdatingRole(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setDeletingUser(userId)
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
      setDeletingUser(null)
    }
  }


  return (
    <Card>
      <CardHeader>
        {/* Search and Filter Controls */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-auto min-w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="SUPPORTER">Supporter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const RoleIcon = roleIcons[user.role]
            
            return (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <UserAvatar 
                    user={{
                      name: user.name,
                      email: user.email,
                      avatarUrl: user.avatarUrl
                    }}
                    size="lg"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{user.name}</p>
                      <Badge variant="outline" className={roleColors[user.role]}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{user._count.assignedTickets} tickets</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{user._count.comments} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleRoleChange(user.id, user.role === 'ADMIN' ? 'SUPPORTER' : 'ADMIN')}
                        disabled={user.id === currentUserId || updatingRole === user.id || deletingUser === user.id}
                      >
                        {updatingRole === user.id ? (
                          <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                        {user.role === 'ADMIN' ? 'Make Supporter' : 'Make Admin'}
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                            disabled={user.id === currentUserId || updatingRole === user.id || deletingUser === user.id}
                          >
                            {deletingUser === user.id ? (
                              <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete User
                          </DropdownMenuItem>
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No users found</p>
              <p className="text-sm">
                {searchQuery || roleFilter !== 'ALL' 
                  ? 'Try adjusting your search or filters.'
                  : 'No users have been created yet.'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}