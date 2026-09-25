import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true, defaultValue: 'Piotr Sławiński' },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      defaultValue: 'Software engineer, builder, speaker and writer.',
    },
    {
      name: 'availability',
      type: 'text',
      admin: { description: 'Short optional “currently / availability” line used by the frontend.' },
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}
