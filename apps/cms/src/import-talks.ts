import { getPayload } from 'payload'

import config from './payload.config'

const TALK_URLS = [
  'https://youtu.be/daCBGdpniuM',
  'https://youtu.be/irNAA46uOlY',
  'https://youtu.be/nF0RzMIgzfg?start=467',
  'https://youtu.be/e6Oj4F-OWos',
] as const

const getVideoId = (value: string) => {
  const url = new URL(value)
  if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || ''
  return url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1) || ''
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)

const fetchYouTubeTitle = async (videoUrl: string, fallback: string) => {
  try {
    const endpoint = new URL('https://www.youtube.com/oembed')
    endpoint.searchParams.set('url', videoUrl)
    endpoint.searchParams.set('format', 'json')
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) return fallback
    const data = (await response.json()) as { title?: string }
    return data.title?.trim() || fallback
  } catch {
    return fallback
  }
}

const importTalks = async () => {
  const payload = await getPayload({ config })
  let created = 0
  let updated = 0

  for (const [index, videoUrl] of TALK_URLS.entries()) {
    const videoId = getVideoId(videoUrl)
    const fallbackTitle = `WarsawJS talk ${index + 1}`
    const title = await fetchYouTubeTitle(videoUrl, fallbackTitle)
    const baseSlug = slugify(title) || 'warsawjs-talk'
    const slug = `${baseSlug}-${videoId.toLowerCase()}`
    const data = {
      title,
      slug,
      event: 'WarsawJS',
      videoUrl,
    }

    const existing = await payload.find({
      collection: 'talks',
      limit: 1,
      pagination: false,
      where: { videoUrl: { equals: videoUrl } },
    })

    if (existing.docs[0]) {
      await payload.update({ collection: 'talks', id: existing.docs[0].id, data })
      updated += 1
      payload.logger.info(`Updated talk: ${title}`)
    } else {
      await payload.create({ collection: 'talks', data })
      created += 1
      payload.logger.info(`Created talk: ${title}`)
    }
  }

  payload.logger.info(`Talk import complete: ${created} created, ${updated} updated, ${TALK_URLS.length} total.`)
  process.exit(0)
}

await importTalks()
