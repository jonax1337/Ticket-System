'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { $createTextNode, $getSelection, $isRangeSelection, TextNode } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createMentionNode } from './mention-node'

interface User {
  id: string
  name: string
  email: string
}

interface MentionPluginProps {
  users: User[]
}

interface MentionSuggestion {
  id: string
  name: string
  email: string
}

function getTextUpToCursor(textNode: TextNode, offset: number): string {
  return textNode.getTextContent().slice(0, offset)
}

function getMentionMatch(text: string): RegExpMatchArray | null {
  // Match @ followed by any characters until double space, newline, or end
  const match = text.match(/@([^@\n\r]*?)(?:\s{2}|$)/) 
  return match ? text.match(/@([^@\n\r]*)$/) : null
}

export function MentionPlugin({ users }: MentionPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionText, setMentionText] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionNode, setMentionNode] = useState<TextNode | null>(null)
  const [mentionOffset, setMentionOffset] = useState(0)
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)
  const [editorElement, setEditorElement] = useState<HTMLElement | null>(null)

  const filteredSuggestions = useMemo(() => {
    if (!mentionText || mentionText.trim() === '') {
      return users.slice(0, 5)
    }
    const searchTerm = mentionText.toLowerCase().trim()
    return users
      .filter(user => {
        const userName = user.name.toLowerCase()
        return userName.includes(searchTerm)
      })
      .slice(0, 5)
  }, [users, mentionText])

  const hideMenu = useCallback(() => {
    setShowSuggestions(false)
    setMentionText('')
    setSelectedIndex(0)
    setMentionNode(null)
    setMentionOffset(0)
  }, [])

  const insertMention = useCallback(
    (user: User) => {
      editor.update(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !mentionNode) return

        // Calculate the start of the mention
        const mentionStart = mentionOffset - mentionText.length - 1
        
        // Split the text node if needed
        const textContent = mentionNode.getTextContent()
        const beforeMention = textContent.slice(0, mentionStart)
        const afterMention = textContent.slice(mentionOffset)

        // Create the mention node
        const mention = $createMentionNode({
          mentionName: user.name,
          mentionId: user.id
        })

        if (beforeMention) {
          const beforeNode = $createTextNode(beforeMention)
          mentionNode.replace(beforeNode)
          beforeNode.insertAfter(mention)
        } else {
          mentionNode.replace(mention)
        }

        if (afterMention) {
          const afterNode = $createTextNode(afterMention)
          mention.insertAfter(afterNode)
          afterNode.select(0, 0)
        } else {
          mention.selectNext()
        }
      })
      hideMenu()
    },
    [editor, mentionNode, mentionOffset, mentionText, hideMenu]
  )

  useEffect(() => {
    console.log('Setting suggestions:', filteredSuggestions)
    setSuggestions(filteredSuggestions)
    setSelectedIndex(0)
  }, [filteredSuggestions])

  // Find the editor element
  useEffect(() => {
    const findEditorElement = () => {
      const contentEditable = document.querySelector('[contenteditable="true"]')
      console.log('findEditorElement called, found:', !!contentEditable, contentEditable)
      if (contentEditable) {
        setEditorElement(contentEditable as HTMLElement)
        console.log('editorElement set:', contentEditable)
      } else {
        console.log('No contentEditable element found')
      }
    }

    findEditorElement()
    // Retry if not found immediately (for SSR)
    const timeout = setTimeout(() => {
      console.log('Retry finding editor element after 100ms')
      findEditorElement()
    }, 100)
    return () => clearTimeout(timeout)
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!showSuggestions) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Check if click is outside editor or dropdown
      const isClickInEditor = editorElement?.contains(target)
      const isClickInDropdown = anchorElement?.contains(target) || 
        (target as Element)?.closest('[data-mention-dropdown]')
      
      if (!isClickInEditor && !isClickInDropdown) {
        console.log('Click outside detected, hiding menu')
        hideMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSuggestions, editorElement, anchorElement, hideMenu])

  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          hideMenu()
          return
        }

        const anchor = selection.anchor
        const node = anchor.getNode()
        
        if (node instanceof TextNode) {
          const textUpToCursor = getTextUpToCursor(node, anchor.offset)
          const match = getMentionMatch(textUpToCursor)
          
          if (match) {
            const searchText = match[1]
            console.log('Mention match found:', searchText, 'in text:', textUpToCursor)
            setMentionText(searchText)
            setMentionNode(node)
            setMentionOffset(anchor.offset)
            
            setShowSuggestions(true)
            
            // Update anchor element position to follow cursor (relative to editor)
            const domSelection = window.getSelection()
            console.log('Editor element found:', !!editorElement, editorElement)
            console.log('DOM selection:', !!domSelection, domSelection?.rangeCount)
            if (domSelection && domSelection.rangeCount > 0) {
              const currentRange = domSelection.getRangeAt(0)
              const currentRect = currentRange.getBoundingClientRect()
              
              if (editorElement) {
                const editorRect = editorElement.getBoundingClientRect()
                
                // Calculate position relative to editor
                const relativeTop = currentRect.bottom - editorRect.top + 5
                const relativeLeft = currentRect.left - editorRect.left
                
                if (anchorElement) {
                  // Update existing anchor element position
                  anchorElement.style.top = `${relativeTop}px`
                  anchorElement.style.left = `${relativeLeft}px`
                } else {
                  // Create new anchor element at cursor position relative to editor
                  const tempElement = document.createElement('div')
                  tempElement.style.position = 'absolute'
                  tempElement.style.top = `${relativeTop}px`
                  tempElement.style.left = `${relativeLeft}px`
                  tempElement.style.width = '1px'
                  tempElement.style.height = '1px'
                  tempElement.style.pointerEvents = 'none'
                  tempElement.style.visibility = 'hidden'
                  editorElement.appendChild(tempElement)
                  setAnchorElement(tempElement)
                }
                
                console.log('Updated dropdown position relative to editor:', relativeTop, relativeLeft)
              } else {
                // Fallback to fixed positioning if no editor element
                console.log('Fallback to fixed positioning')
                if (anchorElement) {
                  anchorElement.style.position = 'fixed'
                  anchorElement.style.top = `${currentRect.bottom + 5}px`
                  anchorElement.style.left = `${currentRect.left}px`
                } else {
                  const tempElement = document.createElement('div')
                  tempElement.style.position = 'fixed'
                  tempElement.style.top = `${currentRect.bottom + 5}px`
                  tempElement.style.left = `${currentRect.left}px`
                  tempElement.style.width = '1px'
                  tempElement.style.height = '1px'
                  tempElement.style.pointerEvents = 'none'
                  tempElement.style.visibility = 'hidden'
                  document.body.appendChild(tempElement)
                  setAnchorElement(tempElement)
                }
                console.log('Created fallback anchor element')
              }
            }
          } else {
            hideMenu()
            if (anchorElement && anchorElement.parentNode) {
              anchorElement.parentNode.removeChild(anchorElement)
              setAnchorElement(null)
            }
          }
        } else {
          hideMenu()
        }
      })
    })

    return removeUpdateListener
  }, [editor, hideMenu, anchorElement, editorElement])

  // Keyboard navigation
  useEffect(() => {
    if (!showSuggestions) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex])
        }
      } else if (event.key === 'Escape') {
        hideMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSuggestions, suggestions, selectedIndex, insertMention, hideMenu])

  // Cleanup anchor element on unmount
  useEffect(() => {
    return () => {
      if (anchorElement && anchorElement.parentNode) {
        anchorElement.parentNode.removeChild(anchorElement)
      }
    }
  }, [anchorElement])

  console.log('Render check:', {
    showSuggestions,
    suggestionsLength: suggestions.length, 
    hasAnchorElement: !!anchorElement,
    mentionText: `"${mentionText}"`
  })

  if (!showSuggestions || suggestions.length === 0 || !anchorElement) {
    return null
  }

  return createPortal(
    <div 
      data-mention-dropdown
      className="absolute z-[9999] w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto"
      style={{
        top: `${parseFloat(anchorElement.style.top) || 0}px`,
        left: `${parseFloat(anchorElement.style.left) || 0}px`,
      }}
    >
      <div className="p-2 text-xs text-muted-foreground border-b">
        Mention a user:
      </div>
      {suggestions.map((user, index) => (
        <button
          key={user.id}
          onClick={() => insertMention(user)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
            index === selectedIndex 
              ? 'bg-blue-50 dark:bg-blue-900/30' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-sm">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </button>
      ))}
    </div>,
    editorElement?.closest('.relative') || document.body
  )
}