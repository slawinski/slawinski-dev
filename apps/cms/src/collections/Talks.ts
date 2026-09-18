import type { CollectionConfig } from 'payload'

export const Talks: CollectionConfig = {
  slug: 'talks',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'event', 'date'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'event', type: 'text', required: true },
    { name: 'date', type: 'date', required: true, index: true },
    { name: 'description', type: 'textarea' },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'videoUrl', type: 'text' },
    { name: 'slidesUrl', type: 'text' },
    { name: 'eventUrl', type: 'text' },
  ],
}
