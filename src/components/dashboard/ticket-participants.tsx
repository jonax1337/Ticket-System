'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
} from '@/components/ui/alert-dialog'
import { Plus, Mail, UserPlus, Users, Trash2, Crown, UserX, User, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TicketParticipant {
  id: string
  email: string
  name?: string | null
  type: string // "creator", "cc", "added_manually"
  createdAt: Date
}

interface TicketParticipantsProps {
  ticketId: string
  participants: TicketParticipant[]
  requester: {
    name: string | null
    email: string
  }
  onRequesterUpdate?: (name: string, email: string) => void
}

const getParticipantIcon = (type: string) => {
  switch (type) {
    case 'creator':
      return <User className="h-4 w-4 text-slate-600" />
    default:
      return <Users className="h-4 w-4 text-slate-600" />
  }
}

const getParticipantBadgeColor = (type: string) => {
  switch (type) {
    case 'creator':
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800'
    default:
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
  }
}

const getParticipantLabel = (type: string) => {
  switch (type) {
    case 'creator':
      return 'Creator'
    default:
      return 'Participant'
  }
}

export default function TicketParticipants({ ticketId, participants, requester, onRequesterUpdate }: TicketParticipantsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [newParticipant, setNewParticipant] = useState({
    email: '',
    name: '',
    type: 'added_manually'
  })
  const [requesterName, setRequesterName] = useState(requester.name || '')
  const [requesterEmail, setRequesterEmail] = useState(requester.email)
  const [isUpdatingRequester, setIsUpdatingRequester] = useState(false)

  const handleAddParticipant = async () => {
    if (!newParticipant.email.trim()) {
      toast.error('Email address is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newParticipant.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newParticipant.email.trim(),
          name: newParticipant.name.trim() || newParticipant.email.trim(),
          type: newParticipant.type
        }),
      })

      if (response.ok) {
        toast.success('Participant added successfully')
        setNewParticipant({ email: '', name: '', type: 'added_manually' })
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add participant')
      }
    } catch (error) {
      console.error('Error adding participant:', error)
      toast.error('Failed to add participant')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/participants/${participantId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Participant removed successfully')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove participant')
      }
    } catch (error) {
      console.error('Error removing participant:', error)
      toast.error('Failed to remove participant')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequesterUpdate = async () => {
    if (!onRequesterUpdate) return
    
    setIsUpdatingRequester(true)
    try {
      await onRequesterUpdate(requesterName, requesterEmail)
      toast.success('Requester updated successfully')
    } catch (error) {
      console.error('Error updating requester:', error)
      toast.error('Failed to update requester')
    } finally {
      setIsUpdatingRequester(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            People & Participants ({participants.length + 1})
          </CardTitle>
          <CardDescription>
            Requester and people involved in this ticket
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>

        {/* Requester */}
        <div className="mb-6">
          <div className="mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-slate-600" />
              Requester
            </h4>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-slate-600" />
              <div>
                <div className="font-medium text-base">
                  {requester.name || requester.email}
                </div>
                {requester.name && requester.name !== requester.email && (
                  <div className="text-sm text-muted-foreground">
                    {requester.email}
                  </div>
                )}
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Edit Requester Information</AlertDialogTitle>
                  <AlertDialogDescription>
                    Update the requester's name and email address for this ticket.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3 py-4">
                  <div className="space-y-1">
                    <Label htmlFor="requester-name">Name</Label>
                    <Input
                      id="requester-name"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder="Requester name"
                      disabled={isUpdatingRequester}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="requester-email">Email</Label>
                    <Input
                      id="requester-email"
                      type="email"
                      value={requesterEmail}
                      onChange={(e) => setRequesterEmail(e.target.value)}
                      placeholder="email@example.com"
                      disabled={isUpdatingRequester}
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRequesterUpdate}
                    disabled={isUpdatingRequester}
                  >
                    Update
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Participants List */}
        <div className="space-y-2">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Additional Participants
            </h4>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Add Participant</AlertDialogTitle>
                  <AlertDialogDescription>
                    Add a new participant to this ticket. They will receive email notifications for updates.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3 py-4">
                  <div className="space-y-1">
                    <Label htmlFor="participant-email">Email Address</Label>
                    <Input
                      id="participant-email"
                      type="email"
                      placeholder="user@example.com"
                      value={newParticipant.email}
                      onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="participant-name">Display Name (Optional)</Label>
                    <Input
                      id="participant-name"
                      placeholder="John Doe"
                      value={newParticipant.name}
                      onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setNewParticipant({ email: '', name: '', type: 'added_manually' })}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAddParticipant}
                    disabled={isLoading || !newParticipant.email.trim()}
                  >
                    Add Participant
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {participants.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <UserX className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No additional participants</p>
            </div>
          ) : (
            participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {getParticipantIcon(participant.type)}
                  <div>
                    <div className="font-medium text-sm">
                      {participant.name || participant.email}
                    </div>
                    {participant.name && participant.name !== participant.email && (
                      <div className="text-xs text-muted-foreground">
                        {participant.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Only allow removal of manually added participants and those added via reply */}
                {(participant.type === 'added_manually' || participant.type === 'added_via_reply') && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Participant</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {participant.name || participant.email} from this ticket?
                          They will no longer receive notifications for this ticket.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveParticipant(participant.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}