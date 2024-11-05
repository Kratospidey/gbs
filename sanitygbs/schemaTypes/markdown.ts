// schemas/markdown.ts
import {defineType} from 'sanity'

export default defineType({
  name: 'markdown',
  title: 'Markdown',
  type: 'text',
  rows: 10,
  description: 'Enter Markdown-formatted text',
})
