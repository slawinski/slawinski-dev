import type { ProjectCardDTO } from '@slawinski/contracts'

const CMS_URL = import.meta.env.PUBLIC_CMS_URL

type PayloadMedia = { url?: string; alt?: string; width?: number; height?: number }
type PayloadProject = {
  slug: string
  title: string
  summary: string
  year?: number
  status?: ProjectCardDTO['status']
  role?: string
  tags?: Array<{ label?: string }>
  links?: Array<{ label?: string; url?: string }>
  caseStudy?: unknown
  cover?: number | PayloadMedia | null
  gallery?: Array<{ image?: number | PayloadMedia | null; caption?: string }>
}
type PayloadList<T> = { docs: T[] }

export type FeaturedProjectMediaDTO = {
  url: string
  alt?: string
  width?: number
  height?: number
  caption?: string
}

export type FeaturedProjectDTO = {
  slug: string
  title: string
  summary: string
  year?: number
  status?: ProjectCardDTO['status']
  role?: string
  tags: string[]
  links: Array<{ label: string; url: string }>
  caseStudy?: unknown
  cover?: FeaturedProjectMediaDTO
  gallery: FeaturedProjectMediaDTO[]
}

const resolveMediaURL = (url: string) => {
  if (!CMS_URL || /^https?:\/\//.test(url)) return url
  return new URL(url, CMS_URL).toString()
}

const toMediaDTO = (media: number | PayloadMedia | null | undefined, caption?: string): FeaturedProjectMediaDTO | undefined => {
  if (!media || typeof media !== 'object' || !media.url) return undefined
  return {
    url: resolveMediaURL(media.url),
    alt: media.alt,
    width: media.width,
    height: media.height,
    caption,
  }
}

const fetchFeaturedProjectDocs = async (): Promise<PayloadProject[]> => {
  if (!CMS_URL) return []

  const url = new URL('/api/projects', CMS_URL)
  url.searchParams.set('where[featured][equals]', 'true')
  url.searchParams.set('where[_status][equals]', 'published')
  url.searchParams.set('sort', 'sortOrder')
  url.searchParams.set('limit', '6')
  url.searchParams.set('depth', '1')

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Payload request failed: ${response.status}`)
  const data = (await response.json()) as PayloadList<PayloadProject>
  return data.docs
}

export async function getFeaturedProjects(): Promise<ProjectCardDTO[]> {
  const docs = await fetchFeaturedProjectDocs()
  return docs.map((project) => ({
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    year: project.year,
    status: project.status,
    role: project.role,
    tags: project.tags?.map((tag) => tag.label).filter((label): label is string => Boolean(label)) ?? [],
    cover:
      project.cover && typeof project.cover === 'object' && project.cover.url && project.cover.alt
        ? {
            url: resolveMediaURL(project.cover.url),
            alt: project.cover.alt,
            width: project.cover.width,
            height: project.cover.height,
          }
        : undefined,
  }))
}

export async function getFeaturedProjectDetails(): Promise<FeaturedProjectDTO[]> {
  const docs = await fetchFeaturedProjectDocs()
  return docs.map((project) => ({
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    year: project.year,
    status: project.status,
    role: project.role,
    tags: project.tags?.map((tag) => tag.label).filter((label): label is string => Boolean(label)) ?? [],
    links:
      project.links?.flatMap((link) =>
        link.label && link.url ? [{ label: link.label, url: link.url }] : [],
      ) ?? [],
    caseStudy: project.caseStudy,
    cover: toMediaDTO(project.cover),
    gallery:
      project.gallery?.flatMap((item) => {
        const media = toMediaDTO(item.image, item.caption)
        return media ? [media] : []
      }) ?? [],
  }))
}

export type WritingPostDTO = {
  slug: string
  title: string
  publishedAt: string
  tags: string[]
  excerpt: string
  content: unknown
}

type PayloadPost = {
  slug: string
  title: string
  publishedAt: string
  excerpt: string
  content: unknown
  tags?: Array<{ label?: string }>
}

export async function getPublishedPosts(): Promise<WritingPostDTO[]> {
  if (!CMS_URL) return []

  const url = new URL('/api/posts', CMS_URL)
  url.searchParams.set('where[_status][equals]', 'published')
  url.searchParams.set('sort', '-publishedAt')
  url.searchParams.set('limit', '100')
  url.searchParams.set('depth', '0')

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Payload request failed: ${response.status}`)

  const data = (await response.json()) as PayloadList<PayloadPost>
  return data.docs.map((post) => ({
    slug: post.slug,
    title: post.title,
    publishedAt: post.publishedAt,
    tags: post.tags?.map((tag) => tag.label).filter((label): label is string => Boolean(label)) ?? [],
    excerpt: post.excerpt,
    content: post.content,
  }))
}

export type TalkDTO = {
  slug: string
  title: string
  event: string
  date?: string
  description?: string
  videoUrl: string
  slidesUrl?: string
  eventUrl?: string
  sortOrder: number
}

type PayloadTalk = {
  slug: string
  title: string
  event: string
  date?: string
  description?: string
  videoUrl?: string
  slidesUrl?: string
  eventUrl?: string
  sortOrder?: number
}

export async function getPublishedTalks(): Promise<TalkDTO[]> {
  if (!CMS_URL) return []

  const url = new URL('/api/talks', CMS_URL)
  url.searchParams.set('where[videoUrl][exists]', 'true')
  url.searchParams.set('sort', 'sortOrder')
  url.searchParams.set('limit', '50')
  url.searchParams.set('depth', '0')

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Payload request failed: ${response.status}`)

  const data = (await response.json()) as PayloadList<PayloadTalk>
  return data.docs.flatMap((talk) =>
    talk.videoUrl
      ? [{
          slug: talk.slug,
          title: talk.title,
          event: talk.event,
          date: talk.date,
          description: talk.description,
          videoUrl: talk.videoUrl,
          slidesUrl: talk.slidesUrl,
          eventUrl: talk.eventUrl,
          sortOrder: talk.sortOrder ?? 100,
        }]
      : [],
  )
}
