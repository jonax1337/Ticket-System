'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Trash2, 
  Plus, 
  User, 
  Users, 
  Eye, 
  Edit, 
  Settings,
  Crown
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
}

interface Permission {
  id: string
  permission: 'VIEW' | 'EDIT' | 'PUBLISH' | 'ADMIN'
  userId: string | null
  role: 'ADMIN' | 'SUPPORTER' | null
  user: User | null
}

interface WikiPermissionsDialogProps {
  isOpen: boolean
  onClose: () => void
  articleId: string
  users: User[]
}

const permissionOptions = [
  { value: 'VIEW', label: 'View', icon: Eye, description: 'Can view the article' },
  { value: 'EDIT', label: 'Edit', icon: Edit, description: 'Can view and edit the article' },
  { value: 'PUBLISH', label: 'Publish', icon: Settings, description: 'Can view, edit and publish the article' },
  { value: 'ADMIN', label: 'Admin', icon: Crown, description: 'Full control including permissions' },
]

const roleOptions = [
  { value: 'ADMIN', label: 'Administrators' },
  { value: 'SUPPORTER', label: 'Supporters' },
]

export function WikiPermissionsDialog({
  isOpen,
  onClose,
  articleId,
  users
}: WikiPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newPermissionType, setNewPermissionType] = useState<'user' | 'role'>('user')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedPermission, setSelectedPermission] = useState<string>('VIEW')

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/wiki/permissions/${articleId}`)
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      toast.error('Failed to load permissions')
    } finally {
      setIsLoading(false)
    }
  }, [articleId])

  // Fetch permissions when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchPermissions()
    }
  }, [isOpen, fetchPermissions])

  const handleAddPermission = async () => {
    if (newPermissionType === 'user' && !selectedUser) {
      toast.error('Please select a user')
      return
    }
    if (newPermissionType === 'role' && !selectedRole) {
      toast.error('Please select a role')
      return
    }

    setIsAdding(true)
    try {
      const response = await fetch(`/api/wiki/permissions/${articleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: newPermissionType === 'user' ? selectedUser : null,
          role: newPermissionType === 'role' ? selectedRole : null,
          permission: selectedPermission
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add permission')
      }

      const newPermission = await response.json()
      setPermissions(prev => [...prev, newPermission])
      
      // Reset form
      setSelectedUser('')
      setSelectedRole('')
      setSelectedPermission('VIEW')
      
      toast.success('Permission added successfully')
    } catch (error) {
      console.error('Error adding permission:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add permission')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeletePermission = async (permissionId: string) => {
    try {
      const response = await fetch(`/api/wiki/permissions/${articleId}?permissionId=${permissionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete permission')
      }

      setPermissions(prev => prev.filter(p => p.id !== permissionId))
      toast.success('Permission removed successfully')
    } catch (error) {
      console.error('Error deleting permission:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove permission')
    }
  }

  const getPermissionInfo = (permission: string) => {
    return permissionOptions.find(opt => opt.value === permission)
  }

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'VIEW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'EDIT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'PUBLISH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Article Permissions</DialogTitle>
          <DialogDescription>
            Control who can access and modify this article. If no permissions are set, 
            published articles are visible to all users.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-auto">
          {/* Add Permission */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Permission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Permission Type</Label>
                  <Select 
                    value={newPermissionType} 
                    onValueChange={(value: 'user' | 'role') => setNewPermissionType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Specific User
                        </div>
                      </SelectItem>
                      <SelectItem value="role">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          User Role
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Access Level</Label>
                  <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {permissionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newPermissionType === 'user' && (
                <div>
                  <Label>Select User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newPermissionType === 'role' && (
                <div>
                  <Label>Select Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleAddPermission}
                disabled={isAdding || (newPermissionType === 'user' && !selectedUser) || (newPermissionType === 'role' && !selectedRole)}
                className="w-full flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {isAdding ? 'Adding...' : 'Add Permission'}
              </Button>
            </CardContent>
          </Card>

          {/* Current Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading permissions...</p>
              ) : permissions.length === 0 ? (
                <p className="text-muted-foreground">
                  No specific permissions set. Published articles are visible to all users.
                </p>
              ) : (
                <div className="space-y-3">
                  {permissions.map((permission) => {
                    const permissionInfo = getPermissionInfo(permission.permission)
                    return (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {permission.userId ? (
                              <User className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Users className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">
                                {permission.user?.name || `${permission.role} Role`}
                              </p>
                              {permission.user && (
                                <p className="text-xs text-muted-foreground">
                                  {permission.user.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className={getPermissionColor(permission.permission)}>
                            {permissionInfo && <permissionInfo.icon className="h-3 w-3 mr-1" />}
                            {permission.permission}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePermission(permission.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}