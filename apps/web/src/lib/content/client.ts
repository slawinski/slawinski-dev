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
  cover?: number | PayloadMedia | null
}
type PayloadList<T> = { docs: T[] }

export async function getFeaturedProjects(): Promise<ProjectCardDTO[]> {
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
  return data.docs.map((project) => ({
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
            url: project.cover.url,
            alt: project.cover.alt,
            width: project.cover.width,
            height: project.cover.height,
          }
        : undefined,
  }))
}
