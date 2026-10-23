import type { Locale } from './urls'

export function formatBytes(bytes: number, locale: Locale): string {
  const loc = locale === 'ru' ? 'ru-RU' : 'en-US'
  const units = locale === 'ru' ? ['Б', 'КБ', 'МБ'] : ['B', 'KB', 'MB']
  if (bytes < 1024) return `${bytes} ${units[0]}`
  if (bytes < 1024 * 1024) {
    const value = bytes / 1024
    const digits = value < 10 ? 1 : 0
    return `${value.toLocaleString(loc, { maximumFractionDigits: digits, minimumFractionDigits: digits })} ${units[1]}`
  }
  const value = bytes / (1024 * 1024)
  const digits = value < 10 ? 2 : 1
  return `${value.toLocaleString(loc, { maximumFractionDigits: digits, minimumFractionDigits: digits })} ${units[2]}`
}

export function sizeDelta(
  before: number,
  after: number,
): { text: string; tone: 'saved' | 'grew' | 'same' } {
  if (before <= 0) return { text: '', tone: 'same' }
  const pct = Math.round((1 - after / before) * 100)
  if (pct > 0) return { text: `−${pct}%`, tone: 'saved' }
  if (pct < 0) return { text: `+${Math.abs(pct)}%`, tone: 'grew' }
  return { text: '0%', tone: 'same' }
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''))
}
