import type { CollectionConfig } from 'payload'

const publicOrAuthenticated = ({ req }: { req: { user?: unknown } }) =>
  req.user ? true : { _status: { equals: 'published' } }

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    read: publicOrAuthenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'year', 'status', 'featured', '_status'],
  },
  versions: {
    drafts: true,
    maxPerDoc: 30,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'summary', type: 'textarea', required: true, maxLength: 220 },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'year', type: 'number' },
    { name: 'role', type: 'text' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'live',
      options: ['live', 'prototype', 'archived'],
    },
    { name: 'featured', type: 'checkbox', defaultValue: false, index: true },
    { name: 'sortOrder', type: 'number', defaultValue: 100, index: true },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'links',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    { name: 'caseStudy', type: 'richText' },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
  ],
}
