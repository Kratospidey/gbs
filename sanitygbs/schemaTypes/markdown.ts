// schemas/markdown.ts
import {defineType, defineField} from 'sanity'

export default {
  name: 'markdown',
  title: 'Markdown',
  type: 'object',
  fields: [
    {
      name: 'content',
      title: 'Content',
      type: 'text', // or another appropriate field type
    },
  ],
}
