'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Mail, Plus, Settings, Trash2, TestTube, CheckCircle, XCircle, Clock, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface InboxConfiguration {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string
  useSSL: boolean
  folder: string
  isActive: boolean
  lastSync: Date | null
  syncInterval: number
  markAsRead: boolean
  deleteAfterImport: boolean
  defaultPriority: string | null
  defaultStatus: string | null
  defaultAssigneeId: string | null
  createdAt: Date
  updatedAt: Date
}

interface InboxSettingsProps {
  inboxes: InboxConfiguration[]
  priorities: Array<{ id: string; name: string }>
  statuses: Array<{ id: string; name: string }>
  users: Array<{ id: string; name: string; email: string }>
}

export default function InboxSettings({ inboxes, priorities, statuses, users }: InboxSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [testingInbox, setTestingInbox] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [editingInbox, setEditingInbox] = useState<InboxConfiguration | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state for new/edit inbox
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 993,
    username: '',
    password: '',
    useSSL: true,
    folder: 'INBOX',
    isActive: true,
    syncInterval: 300,
    markAsRead: true,
    deleteAfterImport: false,
    defaultPriority: '',
    defaultStatus: '',
    defaultAssigneeId: ''
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
      syncInterval: 300,
      markAsRead: true,
      deleteAfterImport: false,
      defaultPriority: '',
      defaultStatus: '',
      defaultAssigneeId: ''
    })
    setEditingInbox(null)
  }

  const openEditDialog = (inbox: InboxConfiguration) => {
    setFormData({
      name: inbox.name,
      host: inbox.host,
      port: inbox.port,
      username: inbox.username,
      password: inbox.password,
      useSSL: inbox.useSSL,
      folder: inbox.folder,
      isActive: inbox.isActive,
      syncInterval: inbox.syncInterval,
      markAsRead: inbox.markAsRead,
      deleteAfterImport: inbox.deleteAfterImport,
      defaultPriority: inbox.defaultPriority || '',
      defaultStatus: inbox.defaultStatus || '',
      defaultAssigneeId: inbox.defaultAssigneeId || ''
    })
    setEditingInbox(inbox)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const url = editingInbox ? `/api/admin/inbox/${editingInbox.id}` : '/api/admin/inbox'
      const method = editingInbox ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          defaultPriority: formData.defaultPriority || null,
          defaultStatus: formData.defaultStatus || null,
          defaultAssigneeId: formData.defaultAssigneeId || null,
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        resetForm()
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save inbox:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (inboxId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Inbox-Konfiguration löschen möchten?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/inbox/${inboxId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete inbox:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTest = async (inboxId: string) => {
    setTestingInbox(inboxId)
    try {
      const response = await fetch(`/api/admin/inbox/${inboxId}/test`, {
        method: 'POST',
      })

      const result = await response.json()
      if (result.success) {
        alert('Verbindung erfolgreich! Gefundene E-Mails: ' + result.messageCount)
      } else {
        alert('Verbindung fehlgeschlagen: ' + result.error)
      }
    } catch (error) {
      alert('Test fehlgeschlagen: ' + error)
    } finally {
      setTestingInbox(null)
    }
  }

  const handleSync = async (inboxId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/inbox/${inboxId}/sync`, {
        method: 'POST',
      })

      const result = await response.json()
      if (result.success) {
        alert(`Synchronisation erfolgreich! ${result.importedCount} neue Tickets importiert.`)
        router.refresh()
      } else {
        alert('Synchronisation fehlgeschlagen: ' + result.error)
      }
    } catch (error) {
      alert('Synchronisation fehlgeschlagen: ' + error)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = (inboxId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [inboxId]: !prev[inboxId]
    }))
  }

  const formatLastSync = (lastSync: Date | null) => {
    if (!lastSync) return 'Noch nie'
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(lastSync))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Inbox-Konfiguration
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie IMAP-Postfächer für den automatischen Ticket-Import.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Inbox
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingInbox ? 'Inbox bearbeiten' : 'Neue Inbox hinzufügen'}
                  </DialogTitle>
                  <DialogDescription>
                    Konfigurieren Sie die IMAP-Verbindung für den automatischen Ticket-Import.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {/* Basic Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Grundeinstellungen</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="z.B. Support E-Mail"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="host">IMAP Server</Label>
                        <Input
                          id="host"
                          value={formData.host}
                          onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                          placeholder="z.B. imap.gmail.com"
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
                          onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="folder">Ordner</Label>
                        <Input
                          id="folder"
                          value={formData.folder}
                          onChange={(e) => setFormData(prev => ({ ...prev, folder: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="syncInterval">Sync-Intervall (Sek.)</Label>
                        <Input
                          id="syncInterval"
                          type="number"
                          value={formData.syncInterval}
                          onChange={(e) => setFormData(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Benutzername/E-Mail</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="ihre-email@domain.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Passwort</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="useSSL"
                        checked={formData.useSSL}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useSSL: !!checked }))}
                      />
                      <Label htmlFor="useSSL">SSL/TLS verwenden</Label>
                    </div>
                  </div>

                  <Separator />

                  {/* Processing Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">E-Mail-Verarbeitung</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                        />
                        <Label htmlFor="isActive">Inbox aktiv</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="markAsRead"
                          checked={formData.markAsRead}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, markAsRead: !!checked }))}
                        />
                        <Label htmlFor="markAsRead">E-Mails nach Import als gelesen markieren</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="deleteAfterImport"
                          checked={formData.deleteAfterImport}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, deleteAfterImport: !!checked }))}
                        />
                        <Label htmlFor="deleteAfterImport">E-Mails nach Import löschen</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Default Ticket Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Standard-Ticket-Einstellungen</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultPriority">Standard-Priorität</Label>
                        <Select
                          value={formData.defaultPriority || undefined}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, defaultPriority: value === 'none' ? '' : value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Keine</SelectItem>
                            {priorities.map((priority) => (
                              <SelectItem key={priority.id} value={priority.name}>
                                {priority.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="defaultStatus">Standard-Status</Label>
                        <Select
                          value={formData.defaultStatus || undefined}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, defaultStatus: value === 'none' ? '' : value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Keine</SelectItem>
                            {statuses.map((status) => (
                              <SelectItem key={status.id} value={status.name}>
                                {status.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="defaultAssignee">Standard-Zuweiser</Label>
                        <Select
                          value={formData.defaultAssigneeId || undefined}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, defaultAssigneeId: value === 'none' ? '' : value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Keine</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Speichern...' : 'Speichern'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {inboxes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Inbox-Konfigurationen vorhanden.</p>
              <p className="text-sm">Fügen Sie eine neue Inbox hinzu, um E-Mails automatisch als Tickets zu importieren.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inboxes.map((inbox) => (
                <Card key={inbox.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{inbox.name}</h3>
                          <Badge variant={inbox.isActive ? "default" : "secondary"}>
                            {inbox.isActive ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Server:</strong> {inbox.host}:{inbox.port} ({inbox.useSSL ? 'SSL' : 'Unverschlüsselt'})</p>
                          <p><strong>Benutzer:</strong> {inbox.username}</p>
                          <p><strong>Passwort:</strong> 
                            <span className="ml-2">
                              {showPassword[inbox.id] ? inbox.password : '••••••••'}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-1 h-6 w-6 p-0"
                                onClick={() => togglePasswordVisibility(inbox.id)}
                              >
                                {showPassword[inbox.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                            </span>
                          </p>
                          <p><strong>Ordner:</strong> {inbox.folder}</p>
                          <p><strong>Letzte Synchronisation:</strong> {formatLastSync(inbox.lastSync)}</p>
                          <p><strong>Sync-Intervall:</strong> {inbox.syncInterval}s</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(inbox.id)}
                          disabled={testingInbox === inbox.id}
                        >
                          {testingInbox === inbox.id ? (
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4 mr-2" />
                          )}
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(inbox.id)}
                          disabled={isLoading || !inbox.isActive}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(inbox)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(inbox.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
