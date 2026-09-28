import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { Talks } from './collections/Talks'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const cmsDir = path.resolve(dirname, '..')

const resolveDatabaseURL = () => {
  const configuredURL = process.env.DATABASE_URL

  if (!configuredURL) {
    const databasePath = path.join(cmsDir, 'data', 'slawinski.db')
    mkdirSync(path.dirname(databasePath), { recursive: true })
    return `file:${databasePath}`
  }

  if (!configuredURL.startsWith('file:')) {
    return configuredURL
  }

  const configuredPath = configuredURL.slice('file:'.length)
  const databasePath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(cmsDir, configuredPath)

  mkdirSync(path.dirname(databasePath), { recursive: true })

  return `file:${databasePath}`
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Posts, Projects, Talks],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: resolveDatabaseURL(),
    },
  }),
  sharp,
})
