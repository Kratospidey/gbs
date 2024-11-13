// schemas/savedPost.ts

import {defineType, defineField, StringRule, ReferenceRule, DatetimeRule} from 'sanity'

export default defineType({
  name: 'savedPost',
  title: 'Saved Posts',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: 'User',
      type: 'string',
      validation: (rule: StringRule) => rule.required(),
    }),
    defineField({
      name: 'posts',
      title: 'Posts',
      type: 'array',
      of: [
        defineField({
          name: 'postItem',
          title: 'Post Item',
          type: 'object',
          fields: [
            defineField({
              name: 'post',
              title: 'Post',
              type: 'reference',
              to: [{type: 'post'}],
              weak: true, // Ensure the reference is weak
              validation: (rule: ReferenceRule) => rule.required(),
            }),
            defineField({
              name: 'savedAt',
              title: 'Saved At',
              type: 'datetime',
              validation: (rule: DatetimeRule) => rule.required(),
            }),
          ],
        }),
      ],
      validation: (rule) => rule.min(0),
    }),
  ],
  preview: {
    select: {
      title: 'posts[0].post.title',
      media: 'posts[0].post.mainImage.asset',
      savedAt: 'posts[0].savedAt',
    },
    prepare(selection: {title?: string; media?: any; savedAt?: string}) {
      const {title, media, savedAt} = selection
      return {
        title: title || 'Untitled Post',
        media: media,
        subtitle: `Saved at: ${savedAt ? new Date(savedAt).toLocaleString() : 'Unknown Date'}`,
      }
    },
  },
})
