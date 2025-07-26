'use client'

import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'

interface CommentContentProps {
  content: string
}

export default function CommentContent({ content }: CommentContentProps) {
  // Parse mentions and convert them to React elements
  const renderContentWithMentions = (text: string) => {
    // Regex to find @[Username](userId) patterns
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      // Add the mention as a badge
      const username = match[1]
      const userId = match[2]
      
      parts.push(
        <Badge 
          key={`mention-${userId}-${match.index}`}
          variant="secondary" 
          className="inline-flex items-center gap-1 mx-0.5 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 text-sm font-normal"
        >
          <User className="h-3 w-3" />
          {username}
        </Badge>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text after the last mention
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : [text]
  }

  const renderedContent = renderContentWithMentions(content)

  return (
    <div className="whitespace-pre-wrap break-words">
      {renderedContent.map((part, index) => 
        typeof part === 'string' ? (
          <span key={index}>{part}</span>
        ) : (
          part
        )
      )}
    </div>
  )
}
