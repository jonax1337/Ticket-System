'use client'

import { useMemo, useImperativeHandle, forwardRef, useRef } from 'react'
import { 
  $getRoot, 
  $createParagraphNode, 
  $createTextNode,
  EditorState,
  $createLineBreakNode
} from 'lexical'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { MentionNode } from './mention-node'
import { MentionPlugin } from './mention-plugin'
import { LineBreakPlugin } from './line-break-plugin'

interface User {
  id: string
  name: string
  email: string
}

interface CommentEditorProps {
  placeholder?: string
  value?: string
  onChange?: (content: string, serializedState?: unknown) => void
  users?: User[]
  disabled?: boolean
  className?: string
}

export interface CommentEditorRef {
  clear: () => void
}

// Internal component that has access to the Lexical editor
function EditorContent({ 
  placeholder, 
  disabled, 
  onChange, 
  users, 
  onClearRef 
}: {
  placeholder: string
  disabled: boolean
  onChange?: (content: string, serializedState?: unknown) => void
  users: User[]
  onClearRef: (clearFn: () => void) => void
}) {
  const [editor] = useLexicalComposerContext()

  // Expose clear function to parent
  useMemo(() => {
    const clearEditor = () => {
      editor.update(() => {
        const root = $getRoot()
        root.clear()
        const paragraph = $createParagraphNode()
        root.append(paragraph)
        paragraph.select()
      })
    }
    onClearRef(clearEditor)
  }, [editor, onClearRef])

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot()
      const textContent = root.getTextContent()
      const serializedState = editorState.toJSON()
      onChange?.(textContent, serializedState)
    })
  }

  return (
    <>
      <RichTextPlugin
        contentEditable={
          <ContentEditable 
            className="min-h-[100px] p-3 outline-none resize-none text-sm"
            aria-placeholder={placeholder}
            placeholder={
              <div className="absolute top-3 left-3 text-muted-foreground pointer-events-none text-sm">
                {placeholder}
              </div>
            }
            readOnly={disabled}
          />
        }
        placeholder={
          <div className="absolute top-3 left-3 text-muted-foreground pointer-events-none text-sm">
            {placeholder}
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      
      <HistoryPlugin />
      
      <OnChangePlugin 
        onChange={handleChange}
        ignoreSelectionChange={true}
      />
      
      {!disabled && <LineBreakPlugin />}
      {!disabled && <MentionPlugin users={users} />}
    </>
  )
}

const theme = {
  paragraph: 'mb-1',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
}

export const CommentEditor = forwardRef<CommentEditorRef, CommentEditorProps>(({
  placeholder = "Add a comment... (use @username to mention someone)",
  value = "",
  onChange,
  users = [],
  disabled = false,
  className = ""
}: CommentEditorProps, ref) => {
  const initialConfig = useMemo(() => ({
    namespace: 'CommentEditor',
    theme,
    nodes: [MentionNode],
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
    editorState: value ? () => {
      const root = $getRoot()
      if (root.getFirstChild() === null) {
        const paragraph = $createParagraphNode()
        paragraph.append($createTextNode(value))
        root.append(paragraph)
      }
    } : undefined,
  }), [value])

  useImperativeHandle(ref, () => ({
    clear: () => {
      // This will be set by EditorContent component
      if (clearFunctionRef.current) {
        clearFunctionRef.current()
      }
    }
  }))

  const clearFunctionRef = useRef<(() => void) | null>(null)

  const handleClearRef = (clearFn: () => void) => {
    clearFunctionRef.current = clearFn
  }

  return (
    <div className={`relative bg-background border border-input rounded-md ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative">
          <EditorContent
            placeholder={placeholder}
            disabled={disabled}
            onChange={onChange}
            users={users}
            onClearRef={handleClearRef}
          />
        </div>
      </LexicalComposer>
    </div>
  )
})