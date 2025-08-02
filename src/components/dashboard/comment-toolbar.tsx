'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Mail, 
  Paperclip, 
  ChevronDown
} from 'lucide-react'
import { getIconComponent } from '@/lib/icon-system'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomStatus } from '@/types/ticket'

interface CommentToolbarProps {
  commentType: 'internal' | 'external'
  onCommentTypeChange: (type: 'internal' | 'external') => void
  nextStatus: string
  onNextStatusChange: (status: string) => void
  statuses: CustomStatus[]
  currentTicketStatus: string
  selectedFiles: File[]
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}

export function CommentToolbar({
  commentType,
  onCommentTypeChange,
  nextStatus,
  onNextStatusChange,
  statuses,
  currentTicketStatus,
  selectedFiles,
  onFileSelect,
  disabled = false
}: CommentToolbarProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
      {/* Left side - Comment Type */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={commentType === 'internal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCommentTypeChange('internal')}
          disabled={disabled}
          className="h-8 gap-2"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Internal</span>
        </Button>
        
        <Button
          type="button"
          variant={commentType === 'external' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCommentTypeChange('external')}
          disabled={disabled}
          className="h-8 gap-2"
        >
          <Mail className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">External</span>
        </Button>
      </div>

      {/* Right side - Status and Attachments */}
      <div className="flex items-center gap-2">
        {/* Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className={`h-8 gap-2 ${nextStatus === currentTicketStatus ? '' : statuses.find(s => s.name === nextStatus)?.color || ''}`}
            >
              {(() => {
                const status = statuses.find(s => s.name === nextStatus)
                if (status) {
                  const IconComponent = getIconComponent(status.icon)
                  return (
                    <>
                      <IconComponent className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{status.name}</span>
                    </>
                  )
                }
                return (
                  <>
                    {(() => {
                      const ClockIcon = getIconComponent('Clock')
                      return <ClockIcon className="h-3.5 w-3.5" />
                    })()}
                    <span className="hidden sm:inline">Status</span>
                  </>
                )
              })()}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {statuses.map((status) => {
              const IconComponent = getIconComponent(status.icon)
              return (
                <DropdownMenuItem 
                  key={status.id} 
                  onClick={() => onNextStatusChange(status.name)}
                  className={nextStatus === status.name ? 'bg-accent' : ''}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {status.name}
                  {status.name === currentTicketStatus && (
                    <span className="ml-auto text-xs text-muted-foreground">current</span>
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Attachment Button */}
        <div className="relative">
          <input
            type="file"
            multiple
            onChange={onFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
            id="toolbar-file-upload"
            disabled={disabled}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 gap-2 relative"
            asChild
          >
            <label htmlFor="toolbar-file-upload" className="cursor-pointer">
              <Paperclip className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Attach</span>
              {selectedFiles.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                  {selectedFiles.length}
                </Badge>
              )}
            </label>
          </Button>
        </div>
      </div>
    </div>
  )
}