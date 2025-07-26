import {
  $applyNodeReplacement,
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import { ReactNode } from 'react'

export interface MentionPayload {
  mentionName: string
  mentionId?: string
}

export type SerializedMentionNode = Spread<
  {
    mentionName: string
    mentionId?: string
  },
  SerializedLexicalNode
>

function $convertMentionElement(domNode: HTMLElement): DOMConversionOutput | null {
  const mentionName = domNode.getAttribute('data-mention-name')
  const mentionId = domNode.getAttribute('data-mention-id')
  if (mentionName) {
    const node = $createMentionNode({ mentionName, mentionId: mentionId || undefined })
    return { node }
  }
  return null
}

export class MentionNode extends DecoratorNode<ReactNode> {
  __mentionName: string
  __mentionId?: string

  static getType(): string {
    return 'mention'
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mentionName, node.__mentionId, node.__key)
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    const { mentionName, mentionId } = serializedNode
    const node = $createMentionNode({ mentionName, mentionId })
    return node
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-mention-name')) {
          return null
        }
        return {
          conversion: $convertMentionElement,
          priority: 1,
        }
      },
    }
  }

  constructor(mentionName: string, mentionId?: string, key?: NodeKey) {
    super(key)
    this.__mentionName = mentionName
    this.__mentionId = mentionId
  }

  exportJSON(): SerializedMentionNode {
    return {
      mentionName: this.__mentionName,
      mentionId: this.__mentionId,
      type: 'mention',
      version: 1,
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span')
    element.setAttribute('data-mention-name', this.__mentionName)
    if (this.__mentionId) {
      element.setAttribute('data-mention-id', this.__mentionId)
    }
    element.textContent = `@${this.__mentionName}`
    element.className = 'mention'
    return { element }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    span.className = 'mention font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded'
    span.setAttribute('data-mention-name', this.__mentionName)
    if (this.__mentionId) {
      span.setAttribute('data-mention-id', this.__mentionId)
    }
    return span
  }

  updateDOM(): false {
    return false
  }

  getMentionName(): string {
    return this.__mentionName
  }

  getMentionId(): string | undefined {
    return this.__mentionId
  }

  setMentionName(mentionName: string): void {
    const writable = this.getWritable()
    writable.__mentionName = mentionName
  }

  setMentionId(mentionId: string): void {
    const writable = this.getWritable()
    writable.__mentionId = mentionId
  }

  isIsolated(): true {
    return true
  }

  isInline(): true {
    return true
  }

  isKeyboardSelectable(): true {
    return true
  }

  decorate(): ReactNode {
    return (
      <span
        className="mention font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded"
        data-mention-name={this.__mentionName}
        data-mention-id={this.__mentionId}
      >
        @{this.__mentionName}
      </span>
    )
  }

  getTextContent(): string {
    return `@${this.__mentionName}`
  }
}

export function $createMentionNode(payload: MentionPayload): MentionNode {
  const mentionNode = new MentionNode(payload.mentionName, payload.mentionId)
  return $applyNodeReplacement(mentionNode)
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  return node instanceof MentionNode
}