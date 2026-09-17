'use client'

import React from 'react'
import { NodeViewWrapper, ReactNodeViewProps } from '@tiptap/react'
import { OgPreviewCard } from './og-preview-card'
import { cn } from '@/lib/utils'

export const LinkPreviewNodeView = ({ node, editor, getPos, selected }: ReactNodeViewProps) => {
  const url = node.attrs.src as string
  const editable = editor.isEditable

  return (
    <NodeViewWrapper
      className={cn('react-component rounded-xl', editable && 'cursor-pointer', editable && selected && 'ring-2 ring-sydeblue ring-offset-2')}
      onMouseDown={(event: React.MouseEvent) => {
        if (!editable) return
        // Select the card as a block (for the card menu) instead of following the link or dropping a caret.
        event.preventDefault()
        const pos = getPos()
        if (typeof pos === 'number') editor.chain().focus().setNodeSelection(pos).run()
      }}
    >
      <OgPreviewCard url={url} interactive={!editable} />
    </NodeViewWrapper>
  )
}
