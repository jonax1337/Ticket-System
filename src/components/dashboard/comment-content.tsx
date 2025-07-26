'use client'


interface CommentContentProps {
  content: string
}

export default function CommentContent({ content }: CommentContentProps) {
  // Parse mentions and convert them to React elements
  const renderContentWithMentions = (text: string) => {
    // First try to parse @[Username](userId) patterns (old format)
    let mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    let parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      // Add the mention as styled text
      const username = match[1]
      const userId = match[2]
      
      parts.push(
        <span 
          key={`mention-${userId}-${match.index}`}
          className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded"
        >
          @{username}
        </span>
      )

      lastIndex = match.index + match[0].length
    }

    // Only show mentions if they are in the old format [@username](userId)
    // Don't automatically style @word patterns unless they're confirmed mentions

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
