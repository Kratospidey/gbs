import { defineConfig } from 'sanity'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'default',
  title: 'Your Project Name',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,

  schema: {
    types: schemaTypes,
  },

  token: process.env.NEXT_PUBLIC_SANITY_API_TOKEN,
})
