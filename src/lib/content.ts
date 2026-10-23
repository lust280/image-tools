import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { marked, Renderer, type Tokens } from 'marked'
import {
  OUTPUTS,
  type DecodeMode,
  type OutputId,
  type ToolClientConfig,
  type ToolKind,
} from './tool-config'
import { homePath, hrefFor, privacyPath, toolPath, type Locale } from './urls'

const root = process.cwd()

export type Faq = { q: string; aHtml: string; aText: string }

export type Doc = {
  locale: Locale
  seoTitle: string
  description: string
  h1: string
  summary: string
  introHtml: string
  howToHtml: string
  faqs: Faq[]
}

export type ToolDoc = Doc & {
  slug: string
  title: string
  order: number
  icon: string
  related: string[]
  client: ToolClientConfig
}

const OUTPUT_IDS: OutputId[] = ['jpg', 'png', 'webp', 'original']
const KINDS: ToolKind[] = ['convert', 'compress', 'resize', 'crop']

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function mdToText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function rewriteLinks(markdown: string, locale: Locale): string {
  return markdown.replace(/\]\((tool|site):([a-z0-9-]+)\)/g, (_match, kind: string, slug: string) => {
    const target =
      kind === 'tool' ? toolPath(locale, slug) : slug === 'home' ? homePath(locale) : privacyPath(locale)
    return `](${hrefFor(target)})`
  })
}

function renderMarkdown(markdown: string, locale: Locale): string {
  const renderer = new Renderer()
  renderer.html = () => ''
  const renderLink = renderer.link.bind(renderer)
  renderer.link = (token: Tokens.Link) => {
    const html = renderLink(token)
    if (/^https?:\/\//.test(token.href)) return html.replace('<a ', '<a rel="noreferrer noopener" ')
    return html
  }
  const parsed = marked.parse(rewriteLinks(markdown, locale), { gfm: true, renderer })
  if (typeof parsed !== 'string') throw new Error('Markdown parser returned a Promise')
  return parsed
}

function parseBody(markdown: string, file: string, locale: Locale): Pick<Doc, 'introHtml' | 'howToHtml' | 'faqs'> {
  const normalized = markdown.replace(/\r\n/g, '\n').trim()
  const faqSplit = normalized.split(/^## FAQ\s*$/m)
  if (faqSplit.length < 2) throw new Error(`${file} is missing a "## FAQ" section`)
  const beforeFaq = faqSplit[0].trim()
  const faqRaw = faqSplit.slice(1).join('\n').trim()
  const h2At = beforeFaq.search(/^## /m)
  const intro = (h2At === -1 ? beforeFaq : beforeFaq.slice(0, h2At)).trim()
  const howTo = (h2At === -1 ? '' : beforeFaq.slice(h2At)).trim()
  const faqs: Faq[] = []
  for (const chunk of faqRaw.split(/^### /m).map((part) => part.trim()).filter(Boolean)) {
    const breakAt = chunk.indexOf('\n')
    const q = (breakAt === -1 ? chunk : chunk.slice(0, breakAt)).trim()
    const a = (breakAt === -1 ? '' : chunk.slice(breakAt + 1)).trim()
    if (!q || !a) throw new Error(`${file} has an empty FAQ entry near "${q}"`)
    faqs.push({ q, aHtml: renderMarkdown(a, locale), aText: mdToText(a) })
  }
  if (faqs.length < 2) throw new Error(`${file} needs at least two FAQs`)
  return {
    introHtml: intro ? renderMarkdown(intro, locale) : '',
    howToHtml: howTo ? renderMarkdown(howTo, locale) : '',
    faqs,
  }
}

function readDocFile(locale: Locale, name: string): Doc {
  const file = path.join(root, 'data', locale, `${name}.md`)
  const raw = readFileSync(file, 'utf8')
  const parsed = matter(raw)
  const data = parsed.data as Record<string, unknown>
  for (const key of ['seoTitle', 'description', 'h1', 'summary']) {
    if (typeof data[key] !== 'string' || !String(data[key]).trim()) {
      throw new Error(`${file} is missing frontmatter "${key}"`)
    }
  }
  return {
    locale,
    seoTitle: String(data.seoTitle),
    description: String(data.description),
    h1: String(data.h1),
    summary: String(data.summary),
    ...parseBody(parsed.content, file, locale),
  }
}

function asStringArray(value: unknown, file: string, key: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${file} frontmatter "${key}" must be a list of strings`)
  }
  return value as string[]
}

function readToolFile(locale: Locale, filename: string): ToolDoc {
  const file = path.join(root, 'data', locale, 'tools', filename)
  const raw = readFileSync(file, 'utf8')
  const parsed = matter(raw)
  const data = parsed.data as Record<string, unknown>
  const slug = filename.replace(/\.md$/, '')
  for (const key of ['title', 'seoTitle', 'description', 'h1', 'summary', 'icon', 'acceptLabel']) {
    if (typeof data[key] !== 'string' || !String(data[key]).trim()) {
      throw new Error(`${file} is missing frontmatter "${key}"`)
    }
  }
  const kind = String(data.kind) as ToolKind
  if (!KINDS.includes(kind)) throw new Error(`${file} has an unknown kind "${String(data.kind)}"`)
  const outputs = asStringArray(data.outputs, file, 'outputs') as OutputId[]
  if (outputs.length === 0 || outputs.some((item) => !OUTPUT_IDS.includes(item))) {
    throw new Error(`${file} has invalid outputs`)
  }
  const defaultOutput = String(data.defaultOutput) as OutputId
  if (!outputs.includes(defaultOutput)) throw new Error(`${file} defaultOutput is not in outputs`)
  const defaultQuality = Number(data.defaultQuality)
  if (!Number.isInteger(defaultQuality) || defaultQuality < 1 || defaultQuality > 100) {
    throw new Error(`${file} defaultQuality must be an integer from 1 to 100`)
  }
  const accept = asStringArray(data.accept, file, 'accept')
  if (accept.some((item) => !item.startsWith('.'))) throw new Error(`${file} accept entries must start with a dot`)
  const decode = (data.decode === 'heic' ? 'heic' : 'bitmap') as DecodeMode
  if (decode === 'heic' && !accept.includes('.heic')) throw new Error(`${file} HEIC tools must accept .heic`)
  if (typeof data.order !== 'number') throw new Error(`${file} order must be a number`)
  const related = asStringArray(data.related, file, 'related')
  const body = parseBody(parsed.content, file, locale)
  const client: ToolClientConfig = {
    slug,
    kind,
    accept,
    acceptLabel: String(data.acceptLabel),
    outputs,
    defaultOutput,
    defaultQuality,
    decode,
    suggest: [],
  }
  return {
    locale,
    slug,
    title: String(data.title),
    seoTitle: String(data.seoTitle),
    description: String(data.description),
    h1: String(data.h1),
    summary: String(data.summary),
    order: data.order,
    icon: String(data.icon),
    related,
    client,
    ...body,
  }
}

const toolCache = new Map<Locale, ToolDoc[]>()
let checked = false

function assertBilingual(en: ToolDoc[], ru: ToolDoc[]) {
  if (checked) return
  checked = true
  const enSlugs = en.map((tool) => tool.slug).sort().join(',')
  const ruSlugs = ru.map((tool) => tool.slug).sort().join(',')
  if (enSlugs !== ruSlugs) throw new Error(`Tool slug mismatch.\nEN: ${enSlugs}\nRU: ${ruSlugs}`)
  const known = new Set(en.map((tool) => tool.slug))
  for (const tool of [...en, ...ru]) {
    for (const slug of tool.related) {
      if (!known.has(slug)) throw new Error(`${tool.locale}/${tool.slug} related slug missing: ${slug}`)
    }
  }
  for (const id of Object.keys(OUTPUTS)) {
    if (!OUTPUT_IDS.includes(id as OutputId)) throw new Error(`Unknown output ${id}`)
  }
}

const FILE_FAMILIES = [
  { ext: '.heic', match: ['.heic', '.heif'] },
  { ext: '.jpg', match: ['.jpg', '.jpeg'] },
  { ext: '.png', match: ['.png'] },
  { ext: '.webp', match: ['.webp'] },
]

function suggestionsFor(tool: ToolDoc, tools: ToolDoc[]) {
  const accept = new Set(tool.client.accept.map((ext) => ext.toLowerCase()))
  const suggestions = []
  for (const family of FILE_FAMILIES) {
    if (family.match.some((ext) => accept.has(ext))) continue
    const best = tools
      .filter(
        (candidate) =>
          candidate.slug !== tool.slug &&
          family.match.some((ext) => candidate.client.accept.some((item) => item.toLowerCase() === ext)),
      )
      .sort((a, b) => {
        const rank = (kind: ToolKind) => (kind === 'convert' ? 0 : kind === 'compress' ? 1 : 2)
        return (
          rank(a.client.kind) - rank(b.client.kind) ||
          a.client.accept.length - b.client.accept.length ||
          a.order - b.order
        )
      })[0]
    if (!best) continue
    suggestions.push({
      ext: family.ext,
      href: hrefFor(toolPath(tool.locale, best.slug)),
      title: best.title,
    })
  }
  return suggestions
}

export function loadTools(locale: Locale): ToolDoc[] {
  const cached = toolCache.get(locale)
  if (cached) return cached
  const dir = path.join(root, 'data', locale, 'tools')
  const tools = readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => readToolFile(locale, name))
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))
  for (const tool of tools) tool.client.suggest = suggestionsFor(tool, tools)
  toolCache.set(locale, tools)
  if (toolCache.has('en') && toolCache.has('ru')) assertBilingual(toolCache.get('en')!, toolCache.get('ru')!)
  return tools
}

export function loadDoc(locale: Locale, name: 'home' | 'privacy'): Doc {
  return readDocFile(locale, name)
}

export type AffiliateItem = {
  href: string
  label: string
  detail: string
}

export type AffiliateContent = {
  disclosure: string
  heading: string
  items: AffiliateItem[]
}

export function loadAffiliate(locale: Locale): AffiliateContent {
  const file = path.join(root, 'data', 'affiliate.json')
  const data = JSON.parse(readFileSync(file, 'utf8')) as {
    disclosure?: Record<Locale, string>
    heading?: Record<Locale, string>
    items?: { href?: string; label?: Record<Locale, string>; detail?: Record<Locale, string> }[]
  }
  if (!data.disclosure?.[locale] || !data.heading?.[locale] || !Array.isArray(data.items)) {
    throw new Error('data/affiliate.json needs disclosure, heading, and items')
  }
  const items = data.items.map((item, index) => {
    if (!item.href || !item.label?.[locale]) {
      throw new Error(`data/affiliate.json item ${index} needs href and label.${locale}`)
    }
    return {
      href: item.href,
      label: item.label[locale],
      detail: item.detail?.[locale] ?? '',
    }
  })
  return { disclosure: data.disclosure[locale], heading: data.heading[locale], items }
}
