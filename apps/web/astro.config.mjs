import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://slawinski.dev',
  output: 'static',
  trailingSlash: 'never',
  redirects: {
    '/writing': '/blog',
  },
})
