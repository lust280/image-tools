export type Rect = { x: number; y: number; w: number; h: number }
export type Handle = 'nw' | 'ne' | 'sw' | 'se'

export function fitAspect(rect: Rect, maxW: number, maxH: number, aspect: number): Rect {
  const maxFitW = Math.min(maxW, maxH * aspect)
  let w = Math.max(1, Math.min(rect.w, maxFitW))
  let h = w / aspect
  if (h > maxH) {
    h = maxH
    w = h * aspect
  }
  if (w > maxW) {
    w = maxW
    h = w / aspect
  }
  const minW = Math.min(maxFitW, Math.max(8, maxFitW * 0.08))
  if (w < minW) {
    w = minW
    h = w / aspect
  }
  let x = rect.x
  let y = rect.y
  if (x < 0) x = 0
  if (y < 0) y = 0
  if (x + w > maxW) x = Math.max(0, maxW - w)
  if (y + h > maxH) y = Math.max(0, maxH - h)
  return { x, y, w, h }
}

export function centeredCrop(imgW: number, imgH: number, aspect: number): Rect {
  if (imgW / imgH > aspect) {
    const h = imgH
    const w = h * aspect
    return fitAspect({ x: (imgW - w) / 2, y: 0, w, h }, imgW, imgH, aspect)
  }
  const w = imgW
  const h = w / aspect
  return fitAspect({ x: 0, y: (imgH - h) / 2, w, h }, imgW, imgH, aspect)
}

export function resizeFromHandle(
  handle: Handle,
  start: Rect,
  dx: number,
  dy: number,
  maxW: number,
  maxH: number,
  aspect: number,
): Rect {
  const anchor = {
    nw: { x: start.x + start.w, y: start.y + start.h },
    ne: { x: start.x, y: start.y + start.h },
    sw: { x: start.x + start.w, y: start.y },
    se: { x: start.x, y: start.y },
  }[handle]
  const movingX = (handle === 'nw' || handle === 'sw' ? start.x : start.x + start.w) + dx
  const movingY = (handle === 'nw' || handle === 'ne' ? start.y : start.y + start.h) + dy
  let w = Math.abs(anchor.x - movingX)
  const hFromW = w / aspect
  const hFromY = Math.abs(anchor.y - movingY)
  if (Math.abs(hFromY - start.h) > Math.abs(hFromW - start.h)) w = hFromY * aspect
  const h = w / aspect
  const x = handle === 'nw' || handle === 'sw' ? anchor.x - w : anchor.x
  const y = handle === 'nw' || handle === 'ne' ? anchor.y - h : anchor.y
  return fitAspect({ x, y, w, h }, maxW, maxH, aspect)
}

export function resizeTarget(
  naturalW: number,
  naturalH: number,
  mode: 'px' | 'percent',
  widthValue: number,
  heightValue: number,
  lock: boolean,
  anchor: 'width' | 'height',
  maxSide: number,
): { w: number; h: number; clamped: boolean } {
  let w: number
  let h: number
  if (mode === 'percent') {
    const pw = clamp(widthValue, 1, 400)
    const ph = lock ? pw : clamp(heightValue, 1, 400)
    w = Math.max(1, Math.round((naturalW * pw) / 100))
    h = Math.max(1, Math.round((naturalH * ph) / 100))
  } else if (lock) {
    if (anchor === 'height') {
      h = Math.max(1, Math.round(heightValue))
      w = Math.max(1, Math.round((h * naturalW) / naturalH))
    } else {
      w = Math.max(1, Math.round(widthValue))
      h = Math.max(1, Math.round((w * naturalH) / naturalW))
    }
  } else {
    w = Math.max(1, Math.round(widthValue))
    h = Math.max(1, Math.round(heightValue))
  }
  let clamped = false
  const long = Math.max(w, h)
  if (long > maxSide) {
    const scale = maxSide / long
    w = Math.max(1, Math.round(w * scale))
    h = Math.max(1, Math.round(h * scale))
    clamped = true
  }
  return { w, h, clamped }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}
