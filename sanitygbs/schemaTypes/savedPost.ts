// schemas/savedPost.ts

import {defineType, defineField, ReferenceRule, DatetimeRule} from 'sanity'

export default defineType({
  name: 'savedPost',
  title: 'Saved Posts',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{type: 'author'}],
      validation: (rule: ReferenceRule) => rule.required(),
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
              weak: true,
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
      userName: 'user.name', // Use dot notation to access the name
      savedAt: 'posts[0].savedAt',
    },
    prepare(selection: {userName?: string; savedAt?: string}) {
      const {userName, savedAt} = selection
      return {
        title: userName ? `${userName}'s saved posts` : 'Saved Posts',
        subtitle: `Saved at: ${savedAt ? new Date(savedAt).toLocaleString() : 'Unknown Date'}`,
      }
    },
  },
})
