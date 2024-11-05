// schemaTypes/savedPost.ts
export default {
  name: 'savedPost',
  title: 'Saved Posts',
  type: 'document',
  fields: [
    {
      name: 'user',
      title: 'User',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'posts',
      title: 'Saved Posts',
      type: 'array',
      validation: (Rule: any) => Rule.unique().required(),
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'post',
              title: 'Post',
              type: 'reference',
              to: [{type: 'post'}],
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'savedAt',
              title: 'Saved At',
              type: 'datetime',
              validation: (Rule: any) => Rule.required(),
            },
          ],
          preview: {
            select: {
              title: 'post.title',
              media: 'post.mainImage.asset',
              savedAt: 'savedAt',
            },
            prepare(selection: {title: string | undefined; media: any; savedAt: string}) {
              const {title, media, savedAt} = selection
              return {
                title: title || 'Untitled Post',
                media: media,
                subtitle: `Saved at: ${new Date(savedAt).toLocaleString()}`,
              }
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      user: 'user',
      posts: 'posts',
    },
    prepare({user, posts}: {user: string; posts?: any[]}) {
      return {
        title: `${user}'s Saved Posts`,
        subtitle: `${posts?.length || 0} posts saved`,
      }
    },
  },
}
