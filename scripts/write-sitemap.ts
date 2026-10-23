import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { absoluteUrl, sitemapUrl } from '../site.config'

function collectPages(root: string): string[] {
  const pages: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (name === 'index.html') {
        const rel = relative(root, dir)
        pages.push(rel === '' ? '/' : `/${rel.split(sep).join('/')}/`)
      }
    }
  }
  walk(root)
  return pages.sort()
}

function localeKey(pagePath: string): string {
  if (pagePath === '/ru/' || pagePath.startsWith('/ru/')) {
    const stripped = pagePath.slice(3)
    return stripped === '' ? '/' : stripped
  }
  return pagePath
}

function localizedPath(key: string, locale: 'en' | 'ru'): string {
  if (locale === 'en') return key
  return key === '/' ? '/ru/' : `/ru${key}`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function writeSitemapAndRobots(dir: URL): string {
  const root = fileURLToPath(dir)
  const pages = collectPages(root)
  const byKey = new Map<string, Set<'en' | 'ru'>>()
  for (const pagePath of pages) {
    const key = localeKey(pagePath)
    const locale: 'en' | 'ru' = pagePath === '/ru/' || pagePath.startsWith('/ru/') ? 'ru' : 'en'
    const set = byKey.get(key) ?? new Set<'en' | 'ru'>()
    set.add(locale)
    byKey.set(key, set)
  }

  const lastmod = new Date().toISOString().slice(0, 10)
  const urls: string[] = []
  for (const pagePath of pages) {
    const key = localeKey(pagePath)
    const locales = byKey.get(key) ?? new Set<'en' | 'ru'>()
    const alternates = [
      locales.has('en') ? `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(absoluteUrl(localizedPath(key, 'en')))}"/>` : '',
      locales.has('ru') ? `    <xhtml:link rel="alternate" hreflang="ru" href="${escapeXml(absoluteUrl(localizedPath(key, 'ru')))}"/>` : '',
      locales.has('en')
        ? `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteUrl(localizedPath(key, 'en')))}"/>`
        : '',
    ].filter(Boolean)
    urls.push(
      `  <url>\n    <loc>${escapeXml(absoluteUrl(pagePath))}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates.join('\n')}\n  </url>`,
    )
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
  writeFileSync(join(root, 'sitemap.xml'), sitemap)
  writeFileSync(
    join(root, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`,
  )
  return sitemapUrl
}
