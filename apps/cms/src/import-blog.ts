import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'

import config from './payload.config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const repoRoot = path.resolve(dirname, '../../..')
const blogDir = path.join(repoRoot, 'blog')

type Frontmatter = {
  title: string
  description: string
  date: string
}

const unquote = (value: string) => {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

const parseFrontmatter = (source: string): { data: Frontmatter; markdown: string } => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) throw new Error('Missing YAML frontmatter')

  const lines = match[1].split(/\r?\n/)
  const values = new Map<string, string>()

  for (let index = 0; index < lines.length; index += 1) {
    const field = lines[index].match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (!field) continue

    const [, key, rawValue] = field
    const continuation: string[] = []
    let next = index + 1

    while (next < lines.length && /^\s+/.test(lines[next])) {
      continuation.push(lines[next].trim())
      next += 1
    }

    if (continuation.length) index = next - 1

    const value =
      rawValue === '>-'
        ? continuation.join(' ')
        : [rawValue, ...continuation].filter(Boolean).join(' ')

    values.set(key, unquote(value))
  }

  const title = values.get('title')
  const description = values.get('description')
  const date = values.get('date')

  if (!title || !description || !date) {
    throw new Error('Frontmatter must contain title, description and date')
  }

  return {
    data: { title, description, date },
    markdown: match[2].trim(),
  }
}

const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g

const importBlog = async () => {
  const payload = await getPayload({ config })
  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  const files = readdirSync(blogDir).filter((name) => name.endsWith('.md')).sort()

  let created = 0
  let updated = 0
  let mediaCreated = 0

  for (const name of files) {
    const sourcePath = path.join(blogDir, name)
    const slug = name.replace(/\.md$/, '')
    const { data, markdown } = parseFrontmatter(readFileSync(sourcePath, 'utf8'))

    let convertedMarkdown = markdown
    const images = [...markdown.matchAll(imagePattern)]

    for (const image of images) {
      const [fullMatch, alt, rawURL] = image
      if (/^(?:https?:|data:)/.test(rawURL)) continue

      const assetPath = path.resolve(blogDir, rawURL)
      if (!existsSync(assetPath)) {
        payload.logger.warn(`Skipping missing image in ${name}: ${rawURL}`)
        continue
      }

      const assetName = path.basename(assetPath)
      const existingMedia = await payload.find({
        collection: 'media',
        limit: 1,
        pagination: false,
        where: { filename: { equals: assetName } },
      })

      const media =
        existingMedia.docs[0] ??
        (await payload.create({
          collection: 'media',
          data: { alt: alt || data.title },
          filePath: assetPath,
        }))

      if (!existingMedia.docs[0]) mediaCreated += 1
      convertedMarkdown = convertedMarkdown.replace(fullMatch, `![media:${media.id}]()`)
    }

    const content = convertMarkdownToLexical({
      editorConfig,
      markdown: convertedMarkdown,
    })

    const postData = {
      title: data.title,
      slug,
      excerpt: data.description.slice(0, 260),
      publishedAt: new Date(data.date).toISOString(),
      content,
      legacyPath: `/blog/${slug}/`,
      seo: {
        title: data.title,
        description: data.description.slice(0, 180),
      },
      _status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'posts',
      limit: 1,
      pagination: false,
      where: { slug: { equals: slug } },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'posts',
        id: existing.docs[0].id,
        data: postData,
        draft: false,
      })
      updated += 1
      payload.logger.info(`Updated post: ${slug}`)
    } else {
      await payload.create({
        collection: 'posts',
        data: postData,
        draft: false,
      })
      created += 1
      payload.logger.info(`Created post: ${slug}`)
    }
  }

  payload.logger.info(
    `Blog import complete: ${created} created, ${updated} updated, ${mediaCreated} media uploaded, ${files.length} total.`,
  )

  process.exit(0)
}

await importBlog()
