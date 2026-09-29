import type { CollectionConfig } from 'payload'

export const Talks: CollectionConfig = {
  slug: 'talks',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'event', 'sortOrder', 'date'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'event', type: 'text', required: true, defaultValue: 'WarsawJS' },
    { name: 'date', type: 'date', index: true },
    {
      name: 'sortOrder',
      type: 'number',
      required: true,
      defaultValue: 100,
      index: true,
      admin: { description: 'Lower numbers appear first in the projector film strip.' },
    },
    { name: 'description', type: 'textarea' },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'videoUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'YouTube URL used by the operations-room projector. Query parameters such as ?start=467 are preserved.',
      },
    },
    { name: 'slidesUrl', type: 'text' },
    { name: 'eventUrl', type: 'text' },
  ],
}
