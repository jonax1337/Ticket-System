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
  Crown,
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
  ADMIN: Crown,
  SUPPORTER: UserCheck,
}

export default function UsersList({ users, currentUserId }: UsersListProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [activityFilter, setActivityFilter] = useState<string>('ALL')
  const router = useRouter()

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchQuery === '' || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
      
      const matchesActivity = activityFilter === 'ALL' || 
        (activityFilter === 'ACTIVE' && (user._count.assignedTickets > 0 || user._count.comments > 0)) ||
        (activityFilter === 'INACTIVE' && user._count.assignedTickets === 0 && user._count.comments === 0)
      
      return matchesSearch && matchesRole && matchesActivity
    })
  }, [users, searchQuery, roleFilter, activityFilter])

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

  const getActivityLevel = (user: User) => {
    const totalActivity = user._count.assignedTickets + user._count.comments
    if (totalActivity === 0) return { level: 'inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800' }
    if (totalActivity < 5) return { level: 'low', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' }
    if (totalActivity < 15) return { level: 'medium', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800' }
    return { level: 'high', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Users ({filteredUsers.length})</span>
        </CardTitle>
        
        {/* Search and Filter Controls */}
        <div className="space-y-4">
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
          </div>
          
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPPORTER">Supporter</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-32">
                <Activity className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Activity</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const RoleIcon = roleIcons[user.role]
            const activity = getActivityLevel(user)
            
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
                      <Badge variant="outline" className={activity.color}>
                        {activity.level}
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
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <AvatarUploadDialog
                        user={{
                          id: user.id,
                          name: user.name,
                          email: user.email,
                          avatarUrl: user.avatarUrl
                        }}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <User className="h-4 w-4 mr-2" />
                            Change Avatar
                          </DropdownMenuItem>
                        }
                      />
                      
                      <DropdownMenuSeparator />
                      
                      {user.id !== currentUserId && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(user.id, user.role === 'ADMIN' ? 'SUPPORTER' : 'ADMIN')}
                            disabled={isLoading}
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            {user.role === 'ADMIN' ? 'Make Supporter' : 'Make Admin'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                                disabled={isLoading}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
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
                        </>
                      )}
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
                {searchQuery || roleFilter !== 'ALL' || activityFilter !== 'ALL' 
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