'use client'

import { useMemo, useImperativeHandle, forwardRef, useRef } from 'react'
import { 
  $getRoot, 
  $createParagraphNode, 
  $createTextNode,
  EditorState,
  FORMAT_TEXT_COMMAND,
  $getSelection
} from 'lexical'
import { $createHeadingNode, HeadingNode } from '@lexical/rich-text'
import { $createListNode, $createListItemNode, ListNode, ListItemNode } from '@lexical/list'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'

import { MentionNode } from '../editor/mention-node'
import { MentionPlugin } from '../editor/mention-plugin'
import { LineBreakPlugin } from '../editor/line-break-plugin'
import { Button } from '../ui/button'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
}

interface WikiEditorProps {
  placeholder?: string
  value?: string
  onChange?: (content: string, serializedState?: unknown) => void
  users?: User[]
  disabled?: boolean
  className?: string
  autoFocus?: boolean
}

export interface WikiEditorRef {
  clear: () => void
  focus: () => void
}

// Toolbar component with rich text controls
function EditorToolbar({ disabled }: { disabled: boolean }) {
  const [editor] = useLexicalComposerContext()

  const formatText = (format: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  const formatHeading = (tag: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection()
      if (selection) {
        const heading = $createHeadingNode(tag)
        selection.insertNodes([heading])
      }
    })
  }

  const formatList = (type: 'bullet' | 'number') => {
    editor.update(() => {
      const selection = $getSelection()
      if (selection) {
        const list = $createListNode(type)
        const listItem = $createListItemNode()
        list.append(listItem)
        selection.insertNodes([list])
      }
    })
  }

  if (disabled) return null

  return (
    <div className="border-b border-border p-2 flex gap-1 flex-wrap">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatText('bold')}
        className="h-8 w-8 p-0"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatText('italic')}
        className="h-8 w-8 p-0"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatText('underline')}
        className="h-8 w-8 p-0"
      >
        <Underline className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h1')}
        className="h-8 px-2"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h2')}
        className="h-8 px-2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h3')}
        className="h-8 px-2"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatList('bullet')}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatList('number')}
        className="h-8 w-8 p-0"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Internal component that has access to the Lexical editor
function EditorContent({ 
  placeholder, 
  disabled, 
  onChange, 
  users, 
  onClearRef,
  onFocusRef,
  autoFocus
}: {
  placeholder: string
  disabled: boolean
  onChange?: (content: string, serializedState?: unknown) => void
  users: User[]
  onClearRef: (clearFn: () => void) => void
  onFocusRef: (focusFn: () => void) => void
  autoFocus: boolean
}) {
  const [editor] = useLexicalComposerContext()

  // Expose clear and focus functions to parent
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

    const focusEditor = () => {
      editor.focus()
    }

    onClearRef(clearEditor)
    onFocusRef(focusEditor)
  }, [editor, onClearRef, onFocusRef])

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
      <EditorToolbar disabled={disabled} />
      
      <RichTextPlugin
        contentEditable={
          <ContentEditable 
            className="min-h-[300px] p-4 outline-none resize-none text-sm focus:ring-0"
            aria-placeholder={placeholder}
            placeholder={
              <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none text-sm">
                {placeholder}
              </div>
            }
            readOnly={disabled}
          />
        }
        placeholder={
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none text-sm">
            {placeholder}
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      
      <HistoryPlugin />
      <ListPlugin />
      {autoFocus && <AutoFocusPlugin />}
      
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
  paragraph: 'mb-2',
  heading: {
    h1: 'text-3xl font-bold mb-4',
    h2: 'text-2xl font-bold mb-3',
    h3: 'text-xl font-bold mb-2',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
  list: {
    nested: {
      list: 'pl-4',
    },
    ol: 'list-decimal list-inside mb-2',
    ul: 'list-disc list-inside mb-2',
  },
  listItem: 'mb-1',
}

export const WikiEditor = forwardRef<WikiEditorRef, WikiEditorProps>(function WikiEditor({
  placeholder = "Start writing your wiki article...",
  value = "",
  onChange,
  users = [],
  disabled = false,
  className = "",
  autoFocus = false
}: WikiEditorProps, ref) {
  const initialConfig = useMemo(() => ({
    namespace: 'WikiEditor',
    theme,
    nodes: [MentionNode, ListNode, ListItemNode, HeadingNode],
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
      if (clearFunctionRef.current) {
        clearFunctionRef.current()
      }
    },
    focus: () => {
      if (focusFunctionRef.current) {
        focusFunctionRef.current()
      }
    }
  }))

  const clearFunctionRef = useRef<(() => void) | null>(null)
  const focusFunctionRef = useRef<(() => void) | null>(null)

  const handleClearRef = (clearFn: () => void) => {
    clearFunctionRef.current = clearFn
  }

  const handleFocusRef = (focusFn: () => void) => {
    focusFunctionRef.current = focusFn
  }

  return (
    <div className={cn(
      "relative bg-background border border-input rounded-md overflow-hidden",
      disabled ? 'opacity-50 cursor-not-allowed' : '',
      className
    )}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative">
          <EditorContent
            placeholder={placeholder}
            disabled={disabled}
            onChange={onChange}
            users={users}
            onClearRef={handleClearRef}
            onFocusRef={handleFocusRef}
            autoFocus={autoFocus}
          />
        </div>
      </LexicalComposer>
    </div>
  )
})