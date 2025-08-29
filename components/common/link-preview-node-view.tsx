'use client'

import React from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { OgPreviewCard } from './og-preview-card'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LinkPreviewNodeView = ({ node }: { node: any }) => {
  const url = node.attrs.src

  return (
    <NodeViewWrapper className="react-component">
      <OgPreviewCard url={url} />
    </NodeViewWrapper>
  )
}
