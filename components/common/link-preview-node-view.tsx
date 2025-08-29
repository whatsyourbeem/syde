'use client'

import React from 'react'
import { NodeViewWrapper, ReactNodeViewProps } from '@tiptap/react'
import { OgPreviewCard } from './og-preview-card'

export const LinkPreviewNodeView = (props: ReactNodeViewProps) => {
  const url = props.node.attrs.src as string

  return (
    <NodeViewWrapper className="react-component">
      <OgPreviewCard url={url} />
    </NodeViewWrapper>
  )
}
