import type { APIRoute } from 'astro'

import { getFeaturedProjectDetails } from '@/lib/content/client'

export const prerender = true

export const GET: APIRoute = async () => {
  const projects = await getFeaturedProjectDetails().catch(() => [])
  return new Response(JSON.stringify(projects), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
