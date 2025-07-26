'use client'

import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  $createLineBreakNode
} from 'lexical'

export function LineBreakPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        const { shiftKey, key } = event
        
        // Check for Shift+Enter
        if (shiftKey && key === 'Enter') {
          event.preventDefault()
          
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              // Insert a line break node
              const lineBreak = $createLineBreakNode()
              selection.insertNodes([lineBreak])
            }
          })
          
          return true
        }
        
        return false
      },
      COMMAND_PRIORITY_NORMAL
    )
  }, [editor])

  return null
}