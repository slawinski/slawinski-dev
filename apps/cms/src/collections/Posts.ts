import type { CollectionConfig } from 'payload'

const publicOrAuthenticated = ({ req }: { req: { user?: unknown } }) =>
  req.user ? true : { _status: { equals: 'published' } }

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    read: publicOrAuthenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', '_status'],
  },
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
    },
    maxPerDoc: 40,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'excerpt', type: 'textarea', required: true, maxLength: 260 },
    { name: 'publishedAt', type: 'date', required: true, index: true },
    { name: 'hero', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'legacyPath',
      type: 'text',
      admin: { description: 'Original route retained for migration/redirect validation.' },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea', maxLength: 180 },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
