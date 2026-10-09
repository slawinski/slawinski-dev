export interface ImageDTO {
  url: string
  alt: string
  width?: number
  height?: number
}

export interface ProjectCardDTO {
  slug: string
  title: string
  summary: string
  year?: number
  status?: 'live' | 'archived' | 'prototype'
  role?: string
  tags: string[]
  cover?: ImageDTO
}

export interface PostListItemDTO {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  readingTimeMinutes?: number
  tags: string[]
}
