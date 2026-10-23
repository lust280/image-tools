import { fill, formatBytes, sizeDelta } from '../lib/format'
import { acceptAttribute, fileAllowed, isHeicFile, sanitizeBase } from '../lib/files'
import { centeredCrop, resizeTarget } from '../lib/geometry'
import { MAX_FILES, MAX_SIDE, OUTPUTS, PRESETS, type OutputId, type ToolClientConfig } from '../lib/tool-config'
import type { Locale } from '../lib/urls'
import { toolText } from '../i18n/ui'
import { mountCropStage } from './cropper'
import { decodeSource, encodeBitmap, makeZip, saveBlob } from './image-ops'

type ResultFile = { blob: Blob; url: string; name: string; width: number; height: number }

type Job = {
  id: string
  file: File
  status: 'decoding' | 'ready' | 'encoding' | 'done' | 'error'
  error?: string
  bitmap?: ImageBitmap
  scaled?: boolean
  clamped?: boolean
  crop?: { x: number; y: number; w: number; h: number }
  thumb?: string
  result?: ResultFile
  outName?: string
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

export function mountTool() {
  const root = document.querySelector<HTMLElement>('#tool')
  const configNode = document.querySelector<HTMLScriptElement>('#tool-config')
  if (!root || !configNode?.textContent) return
  const locale: Locale = document.documentElement.lang === 'ru' ? 'ru' : 'en'
  const t = toolText[locale]
  let config: ToolClientConfig
  try {
    config = JSON.parse(configNode.textContent) as ToolClientConfig
  } catch {
    root.textContent = t.fatal
    return
  }

  const touch = window.matchMedia('(pointer: coarse)').matches
  const preferShare = touch
  const manual = config.kind === 'resize' || config.kind === 'crop'
  let jobs: Job[] = []
  let runToken = 0
  let activeId = ''
  let presetId: (typeof PRESETS)[number]['id'] = 'ig-post'
  let mode: 'px' | 'percent' = 'percent'
  let lock = true
  let anchor: 'width' | 'height' = 'width'
  let outputId: OutputId = config.defaultOutput
  let cropDestroy: (() => void) | null = null

  const workspace = el('div', 'workspace')
  workspace.setAttribute('aria-busy', 'false')
  const dropRow = el('div', 'drop-row')
  const drop = el('div', 'drop')
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.multiple = true
  fileInput.accept = acceptAttribute(config.accept)
  fileInput.setAttribute('aria-label', t.choose)
  const dropCopy = el('div', 'drop-copy')
  const dropTitle = el('p', 'drop-title', touch ? t.dropTitleTouch : t.dropTitle)
  const dropHint = el('p', 'drop-hint', config.acceptLabel)
  const chooseBtn = el('span', 'btn', t.choose)
  dropCopy.append(dropTitle, dropHint, chooseBtn)
  drop.append(fileInput, dropCopy)
  const clearBtn = el('button', 'text-btn clear-btn', t.clear)
  clearBtn.type = 'button'
  clearBtn.hidden = true
  clearBtn.addEventListener('click', () => {
    runToken += 1
    for (const job of jobs) release(job)
    jobs = []
    activeId = ''
    alert.textContent = ''
    setStatus('')
    render()
  })
  dropRow.append(drop, clearBtn)

  const localNote = el('p', 'local-note', t.localNote)
  const heicHint = el('p', 'heic-hint', t.heicHint)
  heicHint.hidden = config.decode !== 'heic'

  const form = el('form', 'options')
  form.setAttribute('aria-label', t.options)
  const qualityField = el('label', 'field')
  qualityField.append(el('span', 'field-label', t.quality))
  const qualityRow = el('span', 'slider-row')
  const qualityRange = document.createElement('input')
  qualityRange.type = 'range'
  qualityRange.min = '20'
  qualityRange.max = '100'
  qualityRange.step = '1'
  qualityRange.value = String(config.defaultQuality)
  qualityRange.setAttribute('aria-label', t.quality)
  const qualityNumber = document.createElement('input')
  qualityNumber.type = 'number'
  qualityNumber.min = '20'
  qualityNumber.max = '100'
  qualityNumber.value = String(config.defaultQuality)
  qualityNumber.setAttribute('aria-label', t.quality)
  qualityRow.append(qualityRange, qualityNumber)
  qualityField.append(qualityRow)

  const formatField = el('fieldset', 'format-field')
  const formatLegend = el('legend', undefined, t.format)
  const formatGroup = el('div', 'segment')
  formatGroup.setAttribute('role', 'radiogroup')
  formatGroup.setAttribute('aria-label', t.format)
  formatField.append(formatLegend, formatGroup)
  for (const id of config.outputs) {
    const label = el('label', 'seg')
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'format'
    input.value = id
    input.checked = id === outputId
    input.addEventListener('change', () => {
      if (!input.checked) return
      outputId = id as OutputId
      syncQualityVisibility()
      if (!manual || jobs.some((job) => job.result)) scheduleRun(200, true)
    })
    label.append(input, el('span', undefined, outputLabel(id as OutputId)))
    formatGroup.append(label)
  }
  formatField.hidden = config.outputs.length < 2

  const flatten = el('p', 'hint', t.flatten)
  const presetField = el('fieldset', 'preset-field')
  const presetLegend = el('legend', undefined, t.presetGroup)
  const chips = el('div', 'chips')
  chips.setAttribute('role', 'radiogroup')
  chips.setAttribute('aria-label', t.presetGroup)
  presetField.append(presetLegend, chips)
  for (const preset of PRESETS) {
    const label = el('label', 'chip')
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'preset'
    input.value = preset.id
    input.checked = preset.id === presetId
    input.addEventListener('change', () => {
      if (!input.checked) return
      presetId = preset.id
      for (const job of jobs) {
        if (!job.bitmap) continue
        job.crop = centeredCrop(job.bitmap.width, job.bitmap.height, preset.w / preset.h)
      }
      renderResults()
    })
    label.append(input, el('span', undefined, t.presets[preset.id]))
    chips.append(label)
  }
  presetField.hidden = config.kind !== 'crop'
  const cropHelp = el('p', 'hint', t.cropHelp)
  cropHelp.hidden = config.kind !== 'crop'
  const outputLine = el('p', 'output-line')

  const unitField = el('fieldset', 'unit-field')
  const unitLegend = el('legend', undefined, t.units)
  const unitGroup = el('div', 'segment')
  unitField.append(unitLegend, unitGroup)
  for (const value of ['percent', 'px'] as const) {
    const label = el('label', 'seg')
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'unit'
    input.value = value
    input.checked = value === mode
    input.addEventListener('change', () => {
      if (!input.checked) return
      mode = value
      syncResizeFields()
    })
    label.append(input, el('span', undefined, value === 'percent' ? t.percent : t.pixels))
    unitGroup.append(label)
  }
  unitField.hidden = config.kind !== 'resize'

  const scaleField = el('label', 'field')
  scaleField.append(el('span', 'field-label', t.scale))
  const scaleRow = el('span', 'slider-row')
  const scaleRange = document.createElement('input')
  scaleRange.type = 'range'
  scaleRange.min = '1'
  scaleRange.max = '200'
  scaleRange.value = '100'
  const scaleNumber = document.createElement('input')
  scaleNumber.type = 'number'
  scaleNumber.min = '1'
  scaleNumber.max = '400'
  scaleNumber.value = '100'
  scaleRow.append(scaleRange, scaleNumber)
  scaleField.append(scaleRow)

  const sizeRow = el('div', 'row-2')
  const widthField = el('label', 'field')
  widthField.append(el('span', 'field-label', t.width))
  const widthInput = document.createElement('input')
  widthInput.type = 'number'
  widthInput.min = '1'
  widthInput.inputMode = 'numeric'
  widthField.append(widthInput)
  const heightField = el('label', 'field')
  heightField.append(el('span', 'field-label', t.height))
  const heightInput = document.createElement('input')
  heightInput.type = 'number'
  heightInput.min = '1'
  heightInput.inputMode = 'numeric'
  heightField.append(heightInput)
  sizeRow.append(widthField, heightField)

  const percentRow = el('div', 'row-2')
  const widthPctField = el('label', 'field')
  widthPctField.append(el('span', 'field-label', `${t.width} %`))
  const widthPct = document.createElement('input')
  widthPct.type = 'number'
  widthPct.min = '1'
  widthPct.max = '400'
  widthPct.value = '100'
  widthPctField.append(widthPct)
  const heightPctField = el('label', 'field')
  heightPctField.append(el('span', 'field-label', `${t.height} %`))
  const heightPct = document.createElement('input')
  heightPct.type = 'number'
  heightPct.min = '1'
  heightPct.max = '400'
  heightPct.value = '100'
  heightPctField.append(heightPct)
  percentRow.append(widthPctField, heightPctField)

  const lockLabel = el('label', 'check')
  const lockInput = document.createElement('input')
  lockInput.type = 'checkbox'
  lockInput.checked = true
  lockLabel.append(lockInput, el('span', undefined, t.lock))
  const lockNote = el('p', 'hint', t.lockNote)
  const resizePreview = el('p', 'output-line')
  const batchNote = el('p', 'hint', t.batchNote)

  form.append(
    presetField,
    cropHelp,
    outputLine,
    unitField,
    scaleField,
    percentRow,
    sizeRow,
    lockLabel,
    lockNote,
    resizePreview,
    formatField,
    qualityField,
    flatten,
    batchNote,
  )
  unitField.hidden = config.kind !== 'resize'
  scaleField.hidden = config.kind !== 'resize'
  percentRow.hidden = true
  sizeRow.hidden = true
  lockLabel.hidden = config.kind !== 'resize'
  lockNote.hidden = config.kind !== 'resize'
  resizePreview.hidden = config.kind !== 'resize'
  batchNote.hidden = true

  const alert = el('p', 'alert')
  alert.setAttribute('role', 'alert')
  const status = el('p', 'status')
  status.setAttribute('role', 'status')
  const results = el('div', 'results')
  const actionBar = el('div', 'action-bar')
  const runBtn = el('button', 'btn')
  runBtn.type = 'button'
  runBtn.textContent = config.kind === 'crop' ? t.crop : t.resize
  const zipBtn = el('button', 'btn')
  zipBtn.type = 'button'
  zipBtn.textContent = t.downloadZip
  const saveBtn = el('button', 'btn secondary')
  saveBtn.type = 'button'
  saveBtn.textContent = preferShare ? t.save : t.download
  actionBar.append(runBtn, saveBtn, zipBtn)
  actionBar.hidden = true

  workspace.append(dropRow, localNote, heicHint, form, alert, status, results, actionBar)
  root.append(workspace)

  const syncQualityPair = (source: HTMLInputElement, other: HTMLInputElement) => {
    other.value = source.value
    if ((!manual || jobs.some((job) => job.result)) && jobs.some((job) => job.bitmap)) scheduleRun(250, true)
  }
  qualityRange.addEventListener('input', () => syncQualityPair(qualityRange, qualityNumber))
  qualityNumber.addEventListener('input', () => syncQualityPair(qualityNumber, qualityRange))
  scaleRange.addEventListener('input', () => {
    scaleNumber.value = scaleRange.value
    updateResizePreview()
  })
  scaleNumber.addEventListener('input', () => {
    scaleRange.value = scaleNumber.value
    updateResizePreview()
  })
  widthInput.addEventListener('input', () => {
    anchor = 'width'
    if (lock && jobs[0]?.bitmap) {
      const bitmap = jobs[0].bitmap
      const width = Number(widthInput.value)
      if (width > 0) heightInput.value = String(Math.max(1, Math.round((width * bitmap.height) / bitmap.width)))
    }
    updateResizePreview()
  })
  heightInput.addEventListener('input', () => {
    anchor = 'height'
    if (lock && jobs[0]?.bitmap) {
      const bitmap = jobs[0].bitmap
      const height = Number(heightInput.value)
      if (height > 0) widthInput.value = String(Math.max(1, Math.round((height * bitmap.width) / bitmap.height)))
    }
    updateResizePreview()
  })
  widthPct.addEventListener('input', () => updateResizePreview())
  heightPct.addEventListener('input', () => updateResizePreview())
  lockInput.addEventListener('change', () => {
    lock = lockInput.checked
    syncResizeFields()
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    void runEncode()
  })
  runBtn.addEventListener('click', () => void runEncode())
  saveBtn.addEventListener('click', () => {
    const result = jobs.find((job) => job.result)?.result
    if (result) void saveBlob(result.blob, result.name, preferShare && result.blob.type.startsWith('image/'))
  })
  zipBtn.addEventListener('click', () => void downloadZip())

  fileInput.addEventListener('change', () => {
    if (fileInput.files) addFiles(fileInput.files)
    fileInput.value = ''
  })
  drop.addEventListener('dragover', (event) => {
    event.preventDefault()
    drop.classList.add('is-hot')
  })
  drop.addEventListener('dragleave', () => drop.classList.remove('is-hot'))
  drop.addEventListener('drop', (event) => {
    event.preventDefault()
    drop.classList.remove('is-hot')
    if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files)
  })
  window.addEventListener('dragover', (event) => event.preventDefault())
  window.addEventListener('drop', (event) => event.preventDefault())
  window.addEventListener('paste', (event) => {
    const files = [...(event.clipboardData?.files ?? [])]
    if (files.length) {
      event.preventDefault()
      addFiles(files)
    }
  })

  syncQualityVisibility()
  syncResizeFields()

  function outputLabel(id: OutputId): string {
    if (id === 'jpg') return t.jpg
    if (id === 'png') return t.png
    if (id === 'webp') return t.webp
    return t.original
  }

  function currentPreset() {
    return PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[0]
  }

  function qualityValue(): number {
    const value = Number(qualityNumber.value)
    if (!Number.isFinite(value)) return config.defaultQuality / 100
    return Math.min(100, Math.max(20, value)) / 100
  }

  function resolvedOutput(job: Job): { mime: string; ext: string; quality: boolean } {
    if (outputId !== 'original') return OUTPUTS[outputId]
    const ext = job.file.name.split('.').pop()?.toLowerCase()
    if (job.file.type === 'image/png' || ext === 'png') return OUTPUTS.png
    if (job.file.type === 'image/webp' || ext === 'webp') return OUTPUTS.webp
    return OUTPUTS.jpg
  }

  function acceptsAlpha(): boolean {
    return config.kind === 'crop' || config.accept.some((ext) => ext === '.png' || ext === '.webp')
  }

  function syncQualityVisibility() {
    const sample = jobs.find((job) => job.bitmap) ?? jobs[0]
    const spec = sample ? resolvedOutput(sample) : outputId === 'original' ? OUTPUTS.jpg : OUTPUTS[outputId]
    qualityField.hidden = !spec.quality
    const jpeg = sample ? resolvedOutput(sample).mime === 'image/jpeg' : outputId === 'jpg' || outputId === 'original'
    flatten.hidden = !(jpeg && acceptsAlpha() && config.decode !== 'heic')
  }

  function syncResizeFields() {
    if (config.kind !== 'resize') return
    const percentLocked = mode === 'percent' && lock
    scaleField.hidden = !percentLocked
    percentRow.hidden = !(mode === 'percent' && !lock)
    sizeRow.hidden = mode !== 'px'
    lockNote.hidden = !lock
    updateResizePreview()
  }

  function readResize(naturalW: number, naturalH: number) {
    if (mode === 'percent' && lock) {
      return resizeTarget(naturalW, naturalH, 'percent', Number(scaleNumber.value), Number(scaleNumber.value), true, anchor, MAX_SIDE)
    }
    if (mode === 'percent') {
      return resizeTarget(naturalW, naturalH, 'percent', Number(widthPct.value), Number(heightPct.value), false, anchor, MAX_SIDE)
    }
    return resizeTarget(
      naturalW,
      naturalH,
      'px',
      Number(widthInput.value) || naturalW,
      Number(heightInput.value) || naturalH,
      lock,
      anchor,
      MAX_SIDE,
    )
  }

  function updateResizePreview() {
    const bitmap = jobs[0]?.bitmap
    if (!bitmap || config.kind !== 'resize') {
      resizePreview.textContent = ''
      return
    }
    const target = readResize(bitmap.width, bitmap.height)
    resizePreview.textContent = `${bitmap.width}×${bitmap.height} → ${target.w}×${target.h}`
  }

  function updateOutputLine() {
    if (config.kind !== 'crop') {
      outputLine.hidden = true
      return
    }
    const preset = currentPreset()
    outputLine.hidden = false
    outputLine.textContent = `${t.output} ${fill(t.dimensions, { w: preset.w, h: preset.h })}`
  }

  function flash(message: string) {
    alert.textContent = message
  }

  function setStatus(message: string) {
    status.textContent = message
  }

  let timer = 0
  function scheduleRun(delay: number, encode: boolean) {
    window.clearTimeout(timer)
    if (!encode) return
    timer = window.setTimeout(() => void runEncode(), delay)
  }

  function release(job: Job) {
    job.bitmap?.close()
    if (job.result) URL.revokeObjectURL(job.result.url)
  }

  function addFiles(list: FileList | File[]) {
    const incoming = [...list]
    const room = MAX_FILES - jobs.length
    if (room <= 0) {
      flash(fill(t.tooMany, { max: MAX_FILES }))
      return
    }
    const accepted: File[] = []
    const rejected: File[] = []
    for (const file of incoming.slice(0, room)) {
      if (fileAllowed(file, config.accept)) accepted.push(file)
      else rejected.push(file)
    }
    alert.textContent = ''
    if (incoming.length > room) flash(fill(t.tooMany, { max: MAX_FILES }))
    if (rejected.length) showWrong(rejected)
    if (accepted.length) void decodeAll(accepted)
  }

  function normalizedExt(file: File): string {
    const raw = file.name.includes('.') ? `.${file.name.split('.').pop()!.toLowerCase()}` : ''
    if (raw === '.jpeg') return '.jpg'
    if (raw === '.heif') return '.heic'
    if (raw === '.jpg' || raw === '.png' || raw === '.webp' || raw === '.heic') return raw
    const type = file.type.toLowerCase()
    if (type === 'image/jpeg') return '.jpg'
    if (type === 'image/png') return '.png'
    if (type === 'image/webp') return '.webp'
    if (type === 'image/heic' || type === 'image/heif') return '.heic'
    return ''
  }

  function showWrong(files: File[]) {
    const links: HTMLAnchorElement[] = []
    const seen = new Set<string>()
    for (const file of files) {
      const match = config.suggest.find((item) => item.ext === normalizedExt(file))
      if (!match || seen.has(match.href)) continue
      seen.add(match.href)
      const link = document.createElement('a')
      link.href = match.href
      link.textContent = match.title
      links.push(link)
    }
    alert.replaceChildren(document.createTextNode(fill(t.wrongType, { label: config.acceptLabel })))
    if (!links.length) return
    const [before, after] = t.tryInstead.split('{list}')
    alert.append(document.createTextNode(` ${before ?? ''}`))
    links.forEach((link, index) => {
      if (index > 0) {
        alert.append(document.createTextNode(index === links.length - 1 ? ` ${t.or} ` : ', '))
      }
      alert.append(link)
    })
    alert.append(document.createTextNode(after ?? ''))
  }

  async function decodeAll(files: File[]) {
    const token = ++runToken
    const created = files.map((file) => {
      const job: Job = { id: crypto.randomUUID(), file, status: 'decoding' }
      jobs.push(job)
      return job
    })
    if (!activeId) activeId = created[0].id
    render()
    let cursor = 0
    const workers = Math.min(config.decode === 'heic' ? 1 : 2, created.length)
    await Promise.all(
      Array.from({ length: workers }, async () => {
        while (cursor < created.length) {
          const job = created[cursor++]
          if (token !== runToken) return
          setStatus(fill(t.opening, { name: job.file.name }))
          try {
            const loaded = await decodeSource(job.file, config.decode)
            if (token !== runToken) {
              loaded.bitmap.close()
              return
            }
            job.bitmap = loaded.bitmap
            job.scaled = loaded.scaled
            job.thumb = thumbUrl(loaded.bitmap)
            job.status = 'ready'
            const preset = currentPreset()
            job.crop = centeredCrop(loaded.bitmap.width, loaded.bitmap.height, preset.w / preset.h)
            if (config.kind === 'resize' && jobs[0] === job && !widthInput.value) {
              widthInput.value = String(loaded.bitmap.width)
              heightInput.value = String(loaded.bitmap.height)
            }
          } catch {
            job.status = 'error'
            job.error = config.decode === 'heic' || isHeicFile(job.file) ? t.heicFail : t.decode
          }
          renderResults()
        }
      }),
    )
    if (token !== runToken) return
    syncQualityVisibility()
    updateResizePreview()
    if (!manual) await runEncode()
    else {
      setStatus('')
      updateActions()
    }
  }

  function thumbUrl(bitmap: ImageBitmap): string {
    const max = 640
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.72)
  }

  function assignNames() {
    const used = new Set<string>()
    for (const job of jobs) {
      const spec = resolvedOutput(job)
      const base = sanitizeBase(job.file.name)
      let name = `${base}.${spec.ext}`
      let n = 2
      while (used.has(name.toLowerCase())) {
        name = `${base}-${n}.${spec.ext}`
        n += 1
      }
      used.add(name.toLowerCase())
      job.outName = name
    }
  }

  async function runEncode() {
    const ready = jobs.filter((job) => job.bitmap && job.status !== 'error')
    if (!ready.length) {
      flash(t.decode)
      return
    }
    const token = ++runToken
    assignNames()
    workspace.setAttribute('aria-busy', 'true')
    let index = 0
    for (const job of ready) {
      if (token !== runToken) return
      index += 1
      setStatus(fill(t.working, { n: index, total: ready.length }))
      job.status = 'encoding'
      if (config.kind !== 'crop') renderResults()
      try {
        const encoded = await encodeJob(job)
        if (token !== runToken) {
          URL.revokeObjectURL(encoded.url)
          return
        }
        if (job.result) URL.revokeObjectURL(job.result.url)
        job.result = encoded
        job.status = 'done'
        job.error = undefined
      } catch (error) {
        job.status = 'error'
        job.error = error instanceof Error && error.message === 'webp' ? t.webpFail : error instanceof Error && error.message === 'canvas' ? t.tooLarge : t.encode
      }
    }
    if (token !== runToken) return
    workspace.setAttribute('aria-busy', 'false')
    const ok = jobs.filter((job) => job.result).length
    const bad = jobs.filter((job) => job.status === 'error').length
    setStatus(bad ? fill(t.readyPartial, { ok, bad }) : fill(t.ready, { ok }))
    renderResults()
    updateActions()
  }

  async function encodeJob(job: Job): Promise<ResultFile> {
    if (!job.bitmap) throw new Error('decode')
    const spec = resolvedOutput(job)
    const preset = currentPreset()
    let dw = job.bitmap.width
    let dh = job.bitmap.height
    let sx = 0
    let sy = 0
    let sw = job.bitmap.width
    let sh = job.bitmap.height
    if (config.kind === 'resize') {
      const target = readResize(job.bitmap.width, job.bitmap.height)
      dw = target.w
      dh = target.h
      job.clamped = target.clamped
    } else if (config.kind === 'crop') {
      const crop = job.crop ?? centeredCrop(job.bitmap.width, job.bitmap.height, preset.w / preset.h)
      sx = Math.max(0, Math.round(crop.x))
      sy = Math.max(0, Math.round(crop.y))
      sw = Math.max(1, Math.min(job.bitmap.width - sx, Math.round(crop.w)))
      sh = Math.max(1, Math.min(job.bitmap.height - sy, Math.round(crop.h)))
      dw = preset.w
      dh = preset.h
    }
    const blob = await encodeBitmap(job.bitmap, {
      mime: spec.mime,
      quality: spec.quality ? qualityValue() : 0.92,
      dw,
      dh,
      sx,
      sy,
      sw,
      sh,
    })
    return { blob, url: URL.createObjectURL(blob), name: job.outName || `image.${spec.ext}`, width: dw, height: dh }
  }

  async function downloadZip() {
    const ready = jobs.filter((job) => job.result)
    if (ready.length < 2) return
    const files: Record<string, Uint8Array> = {}
    for (const job of ready) {
      files[job.result!.name] = new Uint8Array(await job.result!.blob.arrayBuffer())
    }
    const zipped = await makeZip(files)
    const blob = new Blob([zipped], { type: 'application/zip' })
    await saveBlob(blob, `${config.slug}.zip`, false)
  }

  function render() {
    drop.classList.toggle('is-compact', jobs.length > 0)
    clearBtn.hidden = jobs.length === 0
    dropTitle.textContent = jobs.length ? t.addMore : touch ? t.dropTitleTouch : t.dropTitle
    chooseBtn.textContent = jobs.length ? t.addMore : t.choose
    batchNote.hidden = jobs.length < 2
    updateOutputLine()
    renderResults()
    updateActions()
  }

  function renderResults() {
    cropDestroy?.()
    cropDestroy = null
    results.replaceChildren()
    if (!jobs.length) return
    if (config.kind === 'crop') {
      renderCrop()
      return
    }
    const list = el('ul', 'file-list')
    list.setAttribute('aria-label', t.results)
    for (const job of jobs) list.append(renderCard(job))
    results.append(list)
  }

  function renderCard(job: Job): HTMLLIElement {
    const item = el('li', 'file-card')
    const head = el('div', 'file-head')
    head.append(el('p', 'file-name', job.file.name))
    const remove = el('button', 'text-btn', '×')
    remove.type = 'button'
    remove.setAttribute('aria-label', fill(t.remove, { name: job.file.name }))
    remove.addEventListener('click', () => removeJob(job.id))
    head.append(remove)
    item.append(head)
    if (job.status === 'decoding' || job.status === 'encoding') {
      item.append(el('p', 'hint', job.status === 'decoding' ? fill(t.opening, { name: job.file.name }) : '…'))
    }
    if (job.error) item.append(el('p', 'error', job.error))
    if (job.scaled) item.append(el('p', 'hint', fill(t.scaled, { max: MAX_SIDE })))
    if (job.clamped) item.append(el('p', 'hint', fill(t.clamped, { max: MAX_SIDE })))
    if (job.bitmap && config.kind === 'resize') {
      const target = readResize(job.bitmap.width, job.bitmap.height)
      item.append(el('p', 'dims', `${job.bitmap.width}×${job.bitmap.height} → ${target.w}×${target.h}`))
    }
    if (job.result) {
      const delta = sizeDelta(job.file.size, job.result.blob.size)
      const sizes = el('p', 'sizes')
      sizes.append(el('span', undefined, formatBytes(job.file.size, locale)))
      sizes.append(el('span', 'arrow', '→'))
      sizes.append(el('span', undefined, formatBytes(job.result.blob.size, locale)))
      const badge = el('strong', `badge${delta.tone === 'grew' ? ' grew' : ''}`, delta.text)
      sizes.append(badge)
      item.append(sizes)
      const compare = el('div', 'compare')
      if (job.thumb) compare.append(figure(job.thumb, `${t.before}: ${job.file.name}`, t.before))
      compare.append(figure(job.result.url, `${t.after}: ${job.result.name}`, `${t.after} ${job.result.width}×${job.result.height}`, true))
      item.append(compare)
      const download = el('button', 'btn secondary', preferShare ? t.save : t.download)
      download.type = 'button'
      download.addEventListener('click', () => {
        if (job.result) void saveBlob(job.result.blob, job.result.name, preferShare)
      })
      item.append(download)
    } else if (!job.error) {
      item.append(el('p', 'hint', formatBytes(job.file.size, locale)))
    }
    return item
  }

  function figure(src: string, alt: string, caption: string, result = false): HTMLElement {
    const node = el('figure')
    const image = document.createElement('img')
    image.src = src
    image.alt = alt
    if (result) image.dataset.role = 'result'
    node.append(image, el('figcaption', undefined, caption))
    return node
  }

  function renderCrop() {
    const active = jobs.find((job) => job.id === activeId && job.bitmap) ?? jobs.find((job) => job.bitmap)
    if (active) activeId = active.id
    if (active?.bitmap) {
      const preset = currentPreset()
      const aspect = preset.w / preset.h
      if (!active.crop) active.crop = centeredCrop(active.bitmap.width, active.bitmap.height, aspect)
      const stageHost = el('div', 'stage-host')
      results.append(stageHost)
      const mounted = mountCropStage(stageHost, {
        bitmap: active.bitmap,
        crop: active.crop,
        aspect,
        label: t.moveCrop,
        handles: { nw: t.handleNw, ne: t.handleNe, sw: t.handleSw, se: t.handleSe },
        onCrop: (crop) => {
          active.crop = crop
        },
      })
      cropDestroy = mounted.destroy
      results.append(el('p', 'output-line', `${t.output} ${preset.w}×${preset.h}`))
    }
    if (jobs.length > 1) {
      const film = el('div', 'film')
      film.setAttribute('aria-label', t.filmstrip)
      jobs.forEach((job, index) => {
        const button = el('button', `film-btn${job.id === activeId ? ' is-active' : ''}`)
        button.type = 'button'
        button.setAttribute('aria-label', job.file.name)
        if (job.id === activeId) button.setAttribute('aria-current', 'true')
        if (job.thumb) {
          const image = document.createElement('img')
          image.src = job.thumb
          image.alt = ''
          button.append(image)
        }
        button.append(el('span', undefined, String(index + 1)))
        button.addEventListener('click', () => {
          activeId = job.id
          renderResults()
        })
        film.append(button)
      })
      results.append(film)
    }
    const done = jobs.filter((job) => job.result)
    if (done.length) {
      const list = el('ul', 'file-list')
      for (const job of done) list.append(renderCard(job))
      results.append(list)
    }
    for (const job of jobs.filter((item) => item.status === 'error')) {
      results.append(el('p', 'error', `${job.file.name}: ${job.error ?? t.decode}`))
    }
  }

  function removeJob(id: string) {
    runToken += 1
    const job = jobs.find((item) => item.id === id)
    if (job) release(job)
    jobs = jobs.filter((item) => item.id !== id)
    if (activeId === id) activeId = jobs[0]?.id ?? ''
    render()
  }

  function updateActions() {
    const busy = jobs.some((job) => job.status === 'decoding' || job.status === 'encoding')
    const done = jobs.filter((job) => job.result)
    const runnable = jobs.some((job) => job.bitmap && job.status !== 'error' && job.status !== 'decoding')
    runBtn.hidden = true
    saveBtn.hidden = true
    zipBtn.hidden = true
    actionBar.hidden = jobs.length === 0
    if (busy) return
    if (manual && runnable && done.length === 0) {
      runBtn.hidden = false
      runBtn.textContent = config.kind === 'crop' ? t.crop : t.resize
    }
    if (done.length === 1) {
      saveBtn.hidden = false
      saveBtn.textContent = preferShare ? t.save : t.download
    }
    if (done.length >= 2) {
      zipBtn.hidden = false
      zipBtn.textContent = t.downloadZip
    }
    if (manual && runnable && done.length > 0) {
      runBtn.hidden = false
      runBtn.textContent = config.kind === 'crop' ? t.crop : t.resize
      runBtn.classList.add('secondary')
    } else {
      runBtn.classList.remove('secondary')
    }
  }
}
