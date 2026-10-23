const EXT_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
}

export function acceptAttribute(exts: string[]): string {
  const mimes = [...new Set(exts.map((ext) => EXT_MIME[ext.toLowerCase()]).filter(Boolean))]
  return [...exts, ...mimes].join(',')
}

export function fileAllowed(file: File, exts: string[]): boolean {
  const allowed = exts.map((ext) => ext.toLowerCase())
  const ext = file.name.includes('.') ? `.${file.name.split('.').pop()!.toLowerCase()}` : ''
  if (ext && allowed.includes(ext)) return true
  const type = file.type.toLowerCase()
  if (!type) return false
  return allowed.some((item) => EXT_MIME[item] === type)
}

export function isHeicFile(file: File): boolean {
  return /\.hei[cf]$/i.test(file.name) || /image\/hei[cf]/i.test(file.type)
}

export function sanitizeBase(filename: string): string {
  const base = filename.replace(/\.[^.\\/]+$/, '')
  const cleaned = base.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').trim()
  return cleaned.slice(0, 80) || 'image'
}
