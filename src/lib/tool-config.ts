export type OutputId = 'jpg' | 'png' | 'webp' | 'original'
export type ToolKind = 'convert' | 'compress' | 'resize' | 'crop'
export type DecodeMode = 'heic' | 'bitmap'

export type ToolClientConfig = {
  slug: string
  kind: ToolKind
  accept: string[]
  acceptLabel: string
  outputs: OutputId[]
  defaultOutput: OutputId
  defaultQuality: number
  decode: DecodeMode
}

export const OUTPUTS: Record<Exclude<OutputId, 'original'>, { mime: string; ext: string; quality: boolean }> = {
  jpg: { mime: 'image/jpeg', ext: 'jpg', quality: true },
  png: { mime: 'image/png', ext: 'png', quality: false },
  webp: { mime: 'image/webp', ext: 'webp', quality: true },
}

export const PRESETS = [
  { id: 'ig-post', w: 1080, h: 1080 },
  { id: 'ig-portrait', w: 1080, h: 1350 },
  { id: 'ig-story', w: 1080, h: 1920 },
  { id: 'yt-thumb', w: 1280, h: 720 },
  { id: 'fb-post', w: 1200, h: 630 },
  { id: 'x-post', w: 1600, h: 900 },
  { id: 'li-post', w: 1200, h: 627 },
  { id: 'pin', w: 1000, h: 1500 },
  { id: 'tiktok', w: 1080, h: 1920 },
] as const

export type PresetId = (typeof PRESETS)[number]['id']

export const MAX_FILES = 24
export const MAX_SIDE = 4096
