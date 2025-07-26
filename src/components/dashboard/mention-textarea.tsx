'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'

interface MentionTextareaProps {
  value: string
  onChange: (value: string) => void
  onMentionTrigger: (query: string, position: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  rows?: number
}

export default function MentionTextarea({
  value,
  onChange,
  onMentionTrigger,
  placeholder,
  disabled,
  className,
  rows = 4
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart || 0
    
    onChange(newValue)
    
    // Check for @ mention
    const textBeforeCursor = newValue.substring(0, cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      onMentionTrigger(mentionMatch[1], cursorPosition)
    }
  }

  const renderTextWithBadges = (text: string) => {
    // Regex to find @[Username](userId) patterns
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        const textPart = text.substring(lastIndex, match.index)
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {textPart}
          </span>
        )
      }

      // Add the mention as a badge
      const username = match[1]
      const userId = match[2]
      
      parts.push(
        <Badge 
          key={`mention-${userId}-${match.index}`}
          variant="secondary" 
          className="inline-flex items-center gap-1 mx-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm font-normal h-5 px-2 py-0"
        >
          <User className="h-3 w-3" />
          {username}
        </Badge>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text after the last mention
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex)
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {remainingText}
        </span>
      )
    }

    return parts.length > 0 ? parts : [
      <span key="empty" className="whitespace-pre-wrap">{text}</span>
    ]
  }

  // Sync scroll between textarea and overlay
  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  return (
    <div className="relative">
      {/* Overlay with rendered badges */}
      <div
        ref={overlayRef}
        className={`absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words p-3 text-sm leading-5 ${className} bg-transparent border-transparent text-transparent`}
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          wordSpacing: 'inherit',
          letterSpacing: 'inherit'
        }}
      >
        <div className="min-h-full">
          {renderTextWithBadges(value)}
        </div>
      </div>

      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`relative bg-transparent ${className} text-transparent caret-gray-900 dark:caret-gray-100 selection:bg-blue-200 dark:selection:bg-blue-800`}
        style={{
          resize: 'none',
          caretColor: 'currentColor'
        }}
      />
      
      {/* Hidden textarea for cursor positioning */}
      <textarea
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`absolute inset-0 bg-background ${className} z-10`}
        style={{
          resize: 'none',
          color: 'transparent',
          backgroundColor: 'transparent'
        }}
      />
    </div>
  )
}
