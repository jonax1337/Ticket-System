'use client'


interface CommentContentProps {
  content: string
}

export default function CommentContent({ content }: CommentContentProps) {
  // Parse mentions and convert them to React elements
  const renderContentWithMentions = (text: string) => {
    // Split text by lines first to preserve line breaks
    const lines = text.split('\n')
    const allParts: (string | React.ReactElement)[] = []
    
    lines.forEach((line, lineIndex) => {
      // Add line break between lines (except for first line)
      if (lineIndex > 0) {
        allParts.push('\n')
      }
      
      // Process mentions in this line
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
      const parts = []
      let lastIndex = 0
      let match

      while ((match = mentionRegex.exec(line)) !== null) {
        // Add text before the mention
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index))
        }

        // Add the mention as styled text
        const username = match[1]
        const userId = match[2]
        
        parts.push(
          <span 
            key={`mention-${userId}-${match.index}-${lineIndex}`}
            className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded"
          >
            @{username}
          </span>
        )

        lastIndex = match.index + match[0].length
      }

      // Add remaining text after the last mention in this line
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex))
      }

      // Add processed parts for this line
      if (parts.length > 0) {
        allParts.push(...parts)
      } else {
        allParts.push(line)
      }
    })

    return allParts.length > 0 ? allParts : [text]
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
