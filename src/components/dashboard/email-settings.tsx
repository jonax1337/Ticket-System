'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/animate-ui/components/tabs'
import { Mail, Plus, Settings, Trash2, TestTube, CheckCircle, XCircle, Clock, Eye, EyeOff, Filter, Zap, RotateCcw, AlertCircle, ArrowRight, CheckCircle2, Timer, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useEmailSyncStatus, useEmailSyncCountdown, formatCountdown, formatTimeSince } from '@/hooks/use-email-sync-status'

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

interface EmailConfiguration {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string
  useSSL: boolean
  folder: string
  isActive: boolean
  isOutbound: boolean
  lastSync: Date | null
  syncInterval: number
  emailAction: string
  moveToFolder: string | null
  processOnlyUnread: boolean
  subjectFilter: string | null
  fromFilter: string | null
  defaultPriority: string | null
  defaultStatus: string | null
  defaultAssigneeId: string | null
  enableAutoSync: boolean
  createdAt: Date
  updatedAt: Date
}

interface EmailSettingsProps {
  emailConfigs: EmailConfiguration[]
  priorities: Array<{ id: string; name: string; icon: string; color: string }>
  statuses: Array<{ id: string; name: string; icon: string; color: string }>
}

export default function EmailSettings({ emailConfigs, priorities, statuses }: EmailSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [testingConfig, setTestingConfig] = useState<string | null>(null)
  const [syncingConfig, setSyncingConfig] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [editingConfig, setEditingConfig] = useState<EmailConfiguration | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Use the real-time email sync status hook
  const { emailConfigs: liveConfigs, loading: statusLoading, error: statusError, refresh: refreshStatus } = useEmailSyncStatus(emailConfigs)
  
  // Local state for optimistic updates
  const [optimisticConfigs, setOptimisticConfigs] = useState<EmailConfiguration[]>([])
  
  // Use optimistic configs if available, otherwise use live configs
  const displayConfigs = optimisticConfigs.length > 0 ? optimisticConfigs : liveConfigs
  
  // Only clear optimistic updates on component unmount or explicit clear
  // Don't auto-clear when liveConfigs change to avoid UI jumps

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 993,
    username: '',
    password: '',
    useSSL: true,
    folder: 'INBOX',
    isActive: true,
    isOutbound: false,
    syncInterval: 300,
    emailAction: 'mark_read',
    moveToFolder: '',
    processOnlyUnread: true,
    subjectFilter: '',
    fromFilter: '',
    defaultPriority: 'none',
    defaultStatus: 'none',
    enableAutoSync: true
  })

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: 993,
      username: '',
      password: '',
      useSSL: true,
      folder: 'INBOX',
      isActive: true,
      isOutbound: false,
      syncInterval: 300,
      emailAction: 'mark_read',
      moveToFolder: '',
      processOnlyUnread: true,
      subjectFilter: '',
      fromFilter: '',
      defaultPriority: 'none',
      defaultStatus: 'none',
      enableAutoSync: true
    })
  }

  const openEditDialog = (config?: EmailConfiguration) => {
    if (config) {
      setEditingConfig(config)
      setFormData({
        name: config.name,
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        useSSL: config.useSSL,
        folder: config.folder,
        isActive: config.isActive,
        isOutbound: config.isOutbound,
        syncInterval: config.syncInterval,
        emailAction: config.emailAction,
        moveToFolder: config.moveToFolder || '',
        processOnlyUnread: config.processOnlyUnread,
        subjectFilter: config.subjectFilter || '',
        fromFilter: config.fromFilter || '',
        defaultPriority: config.defaultPriority || 'none',
        defaultStatus: config.defaultStatus || 'none',
        enableAutoSync: config.enableAutoSync
      })
    } else {
      setEditingConfig(null)
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const url = editingConfig 
        ? `/api/admin/email/${editingConfig.id}`
        : '/api/admin/email'
      
      const method = editingConfig ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          defaultPriority: formData.defaultPriority === 'none' ? null : formData.defaultPriority || null,
          defaultStatus: formData.defaultStatus === 'none' ? null : formData.defaultStatus || null,
          defaultAssigneeId: null,
          subjectFilter: formData.subjectFilter || null,
          fromFilter: formData.fromFilter || null,
          moveToFolder: formData.moveToFolder || null,
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        resetForm()
        toast.success(
          editingConfig ? 'Email configuration updated successfully' : 'Email configuration created successfully'
        )
        // Clear any optimistic updates since we're getting fresh data
        setOptimisticConfigs([])
        await refreshStatus()
      } else {
        toast.error('Failed to save email configuration')
      }
    } catch (err) {
      console.error('Failed to save email configuration:', err)
      toast.error('Failed to save email configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/email/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Email configuration deleted successfully')
        // Clear any optimistic updates since we're getting fresh data
        setOptimisticConfigs([])
        await refreshStatus()
      } else {
        toast.error('Failed to delete email configuration')
      }
    } catch (err) {
      console.error('Failed to delete email configuration:', err)
      toast.error('Failed to delete email configuration')
    }
  }

  const handleTest = async (config: EmailConfiguration) => {
    setTestingConfig(config.id)
    try {
      const response = await fetch(`/api/admin/email/${config.id}/test`, {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Connection successful! Found ${result.messageCount || 0} messages.`)
      } else {
        toast.error(`Connection failed: ${result.error}`)
      }
    } catch (err) {
      toast.error('Test failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setTestingConfig(null)
    }
  }

  const handleSetOutbound = async (configId: string, isOutbound: boolean) => {
    // Optimistic update
    const currentConfigs = displayConfigs
    const updatedConfigs = currentConfigs.map(config => {
      if (config.id === configId) {
        return { ...config, isOutbound }
      }
      // If setting this one as outbound, remove outbound from others
      if (isOutbound && config.isOutbound) {
        return { ...config, isOutbound: false }
      }
      return config
    })
    setOptimisticConfigs(updatedConfigs)

    try {
      const response = await fetch(`/api/admin/email/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isOutbound
        }),
      })

      if (response.ok) {
        toast.success(
          isOutbound 
            ? 'Email configuration set as outbound'
            : 'Email configuration removed from outbound'
        )
        // Keep optimistic state - no refresh needed
        // The optimistic update is already correct
      } else {
        // Revert optimistic update on error
        setOptimisticConfigs([])
        toast.error('Failed to update outbound configuration')
      }
    } catch (err) {
      // Revert optimistic update on error
      setOptimisticConfigs([])
      console.error('Failed to update outbound configuration:', err)
      toast.error('Failed to update outbound configuration')
    }
  }

  const handleSync = async (config: EmailConfiguration) => {
    setSyncingConfig(config.id)
    try {
      const response = await fetch(`/api/admin/email/${config.id}/sync`, {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Sync completed!`, {
          description: `Imported: ${result.importedCount}, Skipped: ${result.skippedCount}, Errors: ${result.errorCount}`
        })
        // Refresh the live status immediately
        await refreshStatus()
      } else {
        toast.error(`Sync failed: ${result.error}`)
      }
    } catch (err) {
      toast.error('Sync failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSyncingConfig(null)
    }
  }

  const formatLastSync = (lastSync: Date | null) => {
    if (!lastSync) return 'Never'
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(lastSync))
  }

  // Real-time sync status component for each email config
  const SyncStatusDisplay = ({ config }: { config: EmailConfiguration }) => {
    const countdown = useEmailSyncCountdown(config)
    
    if (!config.isActive || !config.enableAutoSync) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Last Sync: {formatLastSync(config.lastSync)}</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span className="text-muted-foreground">Last Sync: {formatLastSync(config.lastSync)}</span>
        </div>
        
        {config.lastSync && (
          <div className="flex items-center gap-2">
            <Timer className={`h-3 w-3 ${countdown.isOverdue ? 'text-red-500' : 'text-blue-500'}`} />
            <span className={countdown.isOverdue ? 'text-red-500' : 'text-blue-500'}>
              {countdown.timeToNext > 0 
                ? `Next in ${formatCountdown(countdown.timeToNext)}`
                : countdown.isOverdue 
                  ? 'Overdue'
                  : 'Syncing...'
              }
            </span>
          </div>
        )}
        
        {countdown.timeSinceLast > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs">
              {formatTimeSince(countdown.timeSinceLast)}
            </span>
          </div>
        )}
      </div>
    )
  }


  const getActionBadge = (action: string) => {
    switch (action) {
      case 'mark_read':
        return <Badge variant="secondary" className="text-xs">Mark as read</Badge>
      case 'delete':
        return <Badge variant="destructive" className="text-xs">Delete</Badge>
      case 'move_to_folder':
        return <Badge variant="outline" className="text-xs">Move to folder</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{action}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure IMAP mailboxes for automatic ticket import with advanced processing options.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openEditDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Email Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl w-full max-h-[90vh] m-4 p-0 overflow-hidden flex flex-col gap-0">
                <div className="p-6 border-b flex-shrink-0">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      {editingConfig ? 'Edit Email Configuration' : 'New Email Configuration'}
                    </DialogTitle>
                    <DialogDescription>
                      Configure an IMAP mailbox for automatic ticket import.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-500">
                  <div className="p-6 space-y-6">
                  {/* Basic Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Basic Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Support Email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="host">IMAP Server</Label>
                        <Input
                          id="host"
                          value={formData.host}
                          onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                          placeholder="imap.gmail.com"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          type="number"
                          value={formData.port}
                          onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="folder">Folder</Label>
                        <Input
                          id="folder"
                          value={formData.folder}
                          onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                          placeholder="INBOX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="syncInterval">Sync Interval (Sec.)</Label>
                        <Input
                          id="syncInterval"
                          type="number"
                          value={formData.syncInterval}
                          onChange={(e) => setFormData({ ...formData, syncInterval: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username/Email</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="user@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="useSSL"
                          checked={formData.useSSL}
                          onCheckedChange={(checked) => setFormData({ ...formData, useSSL: !!checked })}
                        />
                        <Label htmlFor="useSSL">Use SSL/TLS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isOutbound"
                          checked={formData.isOutbound}
                          onCheckedChange={(checked) => setFormData({ ...formData, isOutbound: !!checked })}
                        />
                        <Label htmlFor="isOutbound">Use for outbound mail</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="enableAutoSync"
                          checked={formData.enableAutoSync}
                          onCheckedChange={(checked) => setFormData({ ...formData, enableAutoSync: !!checked })}
                        />
                        <Label htmlFor="enableAutoSync">Auto-Sync</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Email Processing */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Email Processing
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emailAction">Action after Import</Label>
                        <Select value={formData.emailAction} onValueChange={(value) => setFormData({ ...formData, emailAction: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mark_read">Mark as read</SelectItem>
                            <SelectItem value="delete">Delete email</SelectItem>
                            <SelectItem value="move_to_folder">Move to folder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {formData.emailAction === 'move_to_folder' && (
                        <div className="space-y-2">
                          <Label htmlFor="moveToFolder">Target Folder</Label>
                          <Input
                            id="moveToFolder"
                            value={formData.moveToFolder}
                            onChange={(e) => setFormData({ ...formData, moveToFolder: e.target.value })}
                            placeholder="Processed"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="processOnlyUnread"
                        checked={formData.processOnlyUnread}
                        onCheckedChange={(checked) => setFormData({ ...formData, processOnlyUnread: !!checked })}
                      />
                      <Label htmlFor="processOnlyUnread">Process only unread emails</Label>
                    </div>
                  </div>

                  <Separator />

                  {/* Filters */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filter (Optional)
                    </h4>
                    
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subjectFilter">Subject Filter (Regex)</Label>
                        <Input
                          id="subjectFilter"
                          value={formData.subjectFilter}
                          onChange={(e) => setFormData({ ...formData, subjectFilter: e.target.value })}
                          placeholder="e.g. ^(Support|Bug|Feature)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fromFilter">Sender Filter (Regex)</Label>
                        <Input
                          id="fromFilter"
                          value={formData.fromFilter}
                          onChange={(e) => setFormData({ ...formData, fromFilter: e.target.value })}
                          placeholder="e.g. @example\\.com$"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Default Ticket Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Default Ticket Settings</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultPriority">Default Priority</Label>
                        <Select value={formData.defaultPriority} onValueChange={(value) => setFormData({ ...formData, defaultPriority: value })}>
                          <SelectTrigger className={formData.defaultPriority !== 'none' ? priorities.find(p => p.name === formData.defaultPriority)?.color || '' : ''}>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {priorities.map((priority) => {
                              const IconComponent = getIconComponent(priority.icon)
                              return (
                                <SelectItem key={priority.id} value={priority.name}>
                                  <span className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    <span>{priority.name}</span>
                                  </span>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="defaultStatus">Default Status</Label>
                        <Select value={formData.defaultStatus} onValueChange={(value) => setFormData({ ...formData, defaultStatus: value })}>
                          <SelectTrigger className={formData.defaultStatus !== 'none' ? statuses.find(s => s.name === formData.defaultStatus)?.color || '' : ''}>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {statuses.map((status) => {
                              const IconComponent = getIconComponent(status.icon)
                              return (
                                <SelectItem key={status.id} value={status.name}>
                                  <span className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    <span>{status.name}</span>
                                  </span>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                <div className="p-6 border-t flex-shrink-0">
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {statusError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Error loading sync status: {statusError}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refreshStatus(true)}
                  className="ml-auto"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          
          {displayConfigs.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No Email Accounts</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first email account to enable automatic ticket creation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {statusLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Updating sync status...</span>
                </div>
              )}
              
              {displayConfigs.map((config) => (
                <div key={config.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{config.name}</h3>
                        <div className="flex gap-1">
                          {config.isActive ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <XCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                          {config.isOutbound && (
                            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                              <Mail className="mr-1 h-3 w-3" />
                              Outbound
                            </Badge>
                          )}
                          {config.enableAutoSync && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="mr-1 h-3 w-3" />
                              Auto-Sync
                            </Badge>
                          )}
                          {getActionBadge(config.emailAction)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span>{config.username}@{config.host}:{config.port}</span>
                        </div>
                        <SyncStatusDisplay config={config} />
                        {(config.subjectFilter || config.fromFilter) && (
                          <div className="flex items-center gap-2">
                            <Filter className="h-3 w-3" />
                            <span>Filters active</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Outbound Mail Selection */}
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="space-y-3">
                          <div className="w-full">
                          <Tabs 
                            value={config.isOutbound ? "outbound" : "inbound"} 
                            onValueChange={(value) => handleSetOutbound(config.id, value === "outbound")}
                            className="w-full"
                          >
                            <TabsList className="grid grid-cols-2 h-auto p-1" style={{ width: '400px' }}>
                              <TabsTrigger value="inbound" className="text-sm">
                                Inbound only
                              </TabsTrigger>
                              <TabsTrigger value="outbound" className="text-sm">
                                Use for outbound mail
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Only one email configuration can be used for outbound mail at a time.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(config)}
                        disabled={testingConfig === config.id}
                      >
                        {testingConfig === config.id ? (
                          <RotateCcw className="h-4 w-4 animate-spin" style={{ animationDirection: 'reverse' }} />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                        Test
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(config)}
                        disabled={syncingConfig === config.id || !config.isActive}
                      >
                        {syncingConfig === config.id ? (
                          <RotateCcw className="h-4 w-4 animate-spin" style={{ animationDirection: 'reverse' }} />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        Sync
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(config)}
                      >
                        <Settings className="h-4 w-4" />
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Email Configuration</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the email configuration &quot;{config.name}&quot;? 
                              This action cannot be undone and will stop automatic ticket creation from this email account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(config.id)}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                            >
                              Delete Configuration
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}