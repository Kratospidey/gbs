// savedPost.ts
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
    // ... other fields ...
  ],
  preview: {
    select: {
      title: 'post.title',
      media: 'post.mainImage.asset',
      savedAt: 'savedAt',
    },
    prepare(selection: Record<string, any>) {
      const {title, media, savedAt} = selection
      return {
        title: title || 'Untitled Post',
        media: media,
        subtitle: `Saved at: ${new Date(savedAt).toLocaleString()}`,
      }
    },
  },
}
