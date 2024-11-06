import {defineConfig} from 'sanity'
import {schemaTypes} from './schemaTypes'
import { visionTool } from '@sanity/vision'
import { deskTool } from 'sanity/desk'

export default defineConfig({
  name: 'default',
  title: 'Babel',

  projectId: 'xclui0cs', // Replace with your actual project ID
  dataset: 'production', // Replace

  plugins: [
    deskTool(),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  token: process.env.NEXT_PUBLIC_SANITY_API_TOKEN,
})
