// schemas/markdown.ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'savedPost',
  title: 'Saved Post',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    }),
    // Add other fields...
  ],
  preview: {
    select: {
      title: 'title',
      author: 'user.name',
      media: 'image',
    },
    prepare(selection) {
      const { title, author, media } = selection
      return {
        title: title || 'Untitled',
        subtitle: author ? `by ${author}` : '',
        media,
      }
    },
  },
})
