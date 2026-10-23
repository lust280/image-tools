import { defineConfig } from 'astro/config'
import { site } from './site.config'
import { writeSitemapAndRobots } from './scripts/write-sitemap'

export default defineConfig({
  site: site.origin,
  base: site.basePath,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    optimizeDeps: {
      exclude: ['heic-to'],
    },
  },
  integrations: [
    {
      name: 'sitemap-robots',
      hooks: {
        'astro:build:done': ({ dir, logger }) => {
          const written = writeSitemapAndRobots(dir)
          logger.info(`Sitemap ready for Search Console and Bing: ${written}`)
        },
      },
    },
  ],
})
