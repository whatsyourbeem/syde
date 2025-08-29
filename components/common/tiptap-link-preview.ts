import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { LinkPreviewNodeView } from './link-preview-node-view'

export interface LinkPreviewOptions {
  HTMLAttributes: Record<string, any>
}

export const LinkPreview = Node.create<LinkPreviewOptions>({
  name: 'linkPreview',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('data-src'),
        renderHTML: attributes => {
          if (!attributes.src) {
            return {}
          }
          return { 'data-src': attributes.src }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="link-preview"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'link-preview' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkPreviewNodeView)
  },
})
