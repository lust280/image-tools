import { MAX_SIDE } from '../lib/tool-config'
import { isHeicFile } from '../lib/files'

export type LoadedBitmap = { bitmap: ImageBitmap; scaled: boolean }

async function scaleBitmap(bitmap: ImageBitmap, maxSide: number): Promise<LoadedBitmap> {
  const long = Math.max(bitmap.width, bitmap.height)
  if (long <= maxSide) return { bitmap, scaled: false }
  const scale = maxSide / long
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('canvas')
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return { bitmap: await createImageBitmap(canvas), scaled: true }
}

export async function loadBitmap(source: Blob, maxSide = MAX_SIDE): Promise<LoadedBitmap> {
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' })
  return scaleBitmap(bitmap, maxSide)
}

export async function decodeSource(file: File, mode: 'heic' | 'bitmap'): Promise<LoadedBitmap> {
  const heic = mode === 'heic' || isHeicFile(file)
  if (!heic) return loadBitmap(file)
  try {
    return await loadBitmap(file)
  } catch (browserError) {
    try {
      const { heicTo } = await import('heic-to')
      const bitmap = await heicTo({ blob: file, type: 'bitmap' })
      return scaleBitmap(bitmap, MAX_SIDE)
    } catch {
      throw browserError instanceof Error ? browserError : new Error('heic')
    }
  }
}

export async function encodeBitmap(
  bitmap: ImageBitmap,
  opts: {
    mime: string
    quality: number
    dw: number
    dh: number
    sx?: number
    sy?: number
    sw?: number
    sh?: number
  },
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(opts.dw))
  canvas.height = Math.max(1, Math.round(opts.dh))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  if (opts.mime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    bitmap,
    opts.sx ?? 0,
    opts.sy ?? 0,
    opts.sw ?? bitmap.width,
    opts.sh ?? bitmap.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, opts.mime, opts.mime === 'image/png' ? undefined : opts.quality)
  })
  if (!blob) throw new Error(opts.mime === 'image/webp' ? 'webp' : 'encode')
  return blob
}

export async function makeZip(files: Record<string, Uint8Array>): Promise<Uint8Array> {
  const { zip } = await import('fflate')
  return new Promise((resolve, reject) => {
    zip(files, { level: 0 }, (error, data) => (error ? reject(error) : resolve(data)))
  })
}

export async function saveBlob(blob: Blob, filename: string, preferShare: boolean): Promise<'shared' | 'downloaded' | 'aborted'> {
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })
  if (preferShare && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'aborted'
    }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  return 'downloaded'
}
