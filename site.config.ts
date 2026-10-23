/**
 * The one public-URL setting for this site.
 *
 * GitHub Pages (default):
 *   https://lust280.github.io/image-tools
 *
 * Custom domain at the domain root (base "/"):
 *   https://your.domain
 *
 * Override without editing this file:
 *   PUBLIC_SITE_ROOT=https://your.domain npm run build
 *
 * Canonical URLs, the sitemap, Open Graph tags, hreflang, and asset prefixes
 * are all derived from SITE_ROOT. See the README for the CNAME step.
 */
const SITE_ROOT = (process.env.PUBLIC_SITE_ROOT || 'https://lust280.github.io/image-tools').replace(
  /\/$/,
  '',
)

function splitRoot(root: string): { origin: string; basePath: string } {
  let url: URL
  try {
    url = new URL(root)
  } catch {
    throw new Error(`PUBLIC_SITE_ROOT / SITE_ROOT is not a valid URL: ${root}`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`SITE_ROOT must be an http(s) URL: ${root}`)
  }
  const path = url.pathname.replace(/\/$/, '')
  return {
    origin: url.origin,
    basePath: path === '' ? '/' : path,
  }
}

const parsed = splitRoot(SITE_ROOT)

export const site = {
  name: 'Foto',
  /** No trailing slash. Example: https://lust280.github.io/image-tools */
  root: SITE_ROOT,
  /** Protocol + host, no path. Example: https://lust280.github.io */
  origin: parsed.origin,
  /** "/" at a domain root, or "/image-tools" on GitHub project Pages. */
  basePath: parsed.basePath,
  repoUrl: 'https://github.com/lust280/image-tools',
  themeColor: '#f3efe6',
  /**
   * Search Console and Bing verification. Leave empty to omit the tags.
   * Paste the content token, or set PUBLIC_GOOGLE_SITE_VERIFICATION /
   * PUBLIC_BING_SITE_VERIFICATION at build time.
   */
  verification: {
    google: process.env.PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    bing: process.env.PUBLIC_BING_SITE_VERIFICATION || '',
  },
}

/** Absolute sitemap URL for robots.txt, Search Console, and Bing. */
export const sitemapUrl = `${site.root}/sitemap.xml`

export function pageHref(pagePath: string): string {
  const base = site.basePath === '/' ? '' : site.basePath
  const path = pagePath.startsWith('/') ? pagePath : `/${pagePath}`
  const withSlash = path.endsWith('/') ? path : `${path}/`
  return `${base}${withSlash}`
}

export function assetHref(assetPath: string): string {
  const base = site.basePath === '/' ? '' : site.basePath
  const path = assetPath.startsWith('/') ? assetPath : `/${assetPath}`
  return `${base}${path}`
}

export function absoluteUrl(pagePath: string): string {
  const base = site.basePath === '/' ? '' : site.basePath
  const path = pagePath.startsWith('/') ? pagePath : `/${pagePath}`
  const withSlash = path.endsWith('/') ? path : `${path}/`
  return `${site.origin}${base}${withSlash}`
}

export function absoluteAsset(assetPath: string): string {
  const base = site.basePath === '/' ? '' : site.basePath
  const path = assetPath.startsWith('/') ? assetPath : `/${assetPath}`
  return `${site.origin}${base}${path}`
}
