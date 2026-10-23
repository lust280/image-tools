import { fitAspect, resizeFromHandle, type Handle, type Rect } from '../lib/geometry'

export function mountCropStage(
  parent: HTMLElement,
  opts: {
    bitmap: ImageBitmap
    crop: Rect
    aspect: number
    label: string
    handles: Record<Handle, string>
    onCrop: (crop: Rect) => void
  },
) {
  parent.replaceChildren()
  const stage = document.createElement('div')
  stage.className = 'stage'
  const canvas = document.createElement('canvas')
  canvas.className = 'stage-canvas'
  const box = document.createElement('div')
  box.className = 'crop-box'
  box.tabIndex = 0
  box.setAttribute('role', 'application')
  box.setAttribute('aria-label', opts.label)
  const thirds = document.createElement('span')
  thirds.className = 'thirds'
  box.append(thirds)
  for (const handle of ['nw', 'ne', 'sw', 'se'] as const) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `handle ${handle}`
    button.dataset.handle = handle
    button.setAttribute('aria-label', opts.handles[handle])
    box.append(button)
  }
  stage.append(canvas, box)
  parent.append(stage)

  let crop = { ...opts.crop }
  const { bitmap, aspect } = opts
  let lastWidth = 0

  const place = () => {
    box.style.left = `${(crop.x / bitmap.width) * 100}%`
    box.style.top = `${(crop.y / bitmap.height) * 100}%`
    box.style.width = `${(crop.w / bitmap.width) * 100}%`
    box.style.height = `${(crop.h / bitmap.height) * 100}%`
  }

  const paint = () => {
    const width = Math.round(stage.clientWidth)
    if (!width) return
    if (width !== lastWidth) {
      lastWidth = width
      const cssHeight = width * (bitmap.height / bitmap.width)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.style.width = `${width}px`
      canvas.style.height = `${cssHeight}px`
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(cssHeight * dpr))
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    }
    place()
  }

  const observer = new ResizeObserver(() => paint())
  observer.observe(stage)
  requestAnimationFrame(paint)

  type Drag =
    | { kind: 'move'; px: number; py: number; crop: Rect }
    | { kind: 'resize'; handle: Handle; px: number; py: number; crop: Rect }
  let drag: Drag | null = null

  const pointDelta = (event: PointerEvent, start: Drag) => {
    const rect = canvas.getBoundingClientRect()
    return {
      dx: ((event.clientX - start.px) / rect.width) * bitmap.width,
      dy: ((event.clientY - start.py) / rect.height) * bitmap.height,
    }
  }

  box.addEventListener('pointerdown', (event) => {
    const handle = (event.target as HTMLElement).dataset.handle as Handle | undefined
    event.preventDefault()
    box.focus()
    box.setPointerCapture(event.pointerId)
    drag = handle
      ? { kind: 'resize', handle, px: event.clientX, py: event.clientY, crop: { ...crop } }
      : { kind: 'move', px: event.clientX, py: event.clientY, crop: { ...crop } }
  })

  box.addEventListener('pointermove', (event) => {
    if (!drag) return
    const { dx, dy } = pointDelta(event, drag)
    crop =
      drag.kind === 'move'
        ? fitAspect({ ...drag.crop, x: drag.crop.x + dx, y: drag.crop.y + dy }, bitmap.width, bitmap.height, aspect)
        : resizeFromHandle(drag.handle, drag.crop, dx, dy, bitmap.width, bitmap.height, aspect)
    place()
    opts.onCrop(crop)
  })

  const end = (event: PointerEvent) => {
    if (box.hasPointerCapture(event.pointerId)) box.releasePointerCapture(event.pointerId)
    drag = null
  }
  box.addEventListener('pointerup', end)
  box.addEventListener('pointercancel', end)

  box.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 20 : 4
    const next = { ...crop }
    if (event.key === 'ArrowLeft') next.x -= step
    else if (event.key === 'ArrowRight') next.x += step
    else if (event.key === 'ArrowUp') next.y -= step
    else if (event.key === 'ArrowDown') next.y += step
    else return
    event.preventDefault()
    crop = fitAspect(next, bitmap.width, bitmap.height, aspect)
    place()
    opts.onCrop(crop)
  })

  stage.addEventListener('pointerdown', (event) => {
    if (box.contains(event.target as Node)) return
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * bitmap.width
    const y = ((event.clientY - rect.top) / rect.height) * bitmap.height
    crop = fitAspect({ ...crop, x: x - crop.w / 2, y: y - crop.h / 2 }, bitmap.width, bitmap.height, aspect)
    place()
    opts.onCrop(crop)
  })

  return {
    destroy() {
      observer.disconnect()
    },
  }
}
