import type { PresetId } from '../lib/tool-config'
import type { Locale } from '../lib/urls'

export const chrome = {
  en: {
    skip: 'Skip to content',
    language: 'Language',
    privacy: 'Privacy',
    tagline: 'Free image tools. Files never leave this device.',
    breadcrumb: 'Breadcrumb',
    related: 'Related tools',
    allTools: 'All tools',
    kicker: 'In your browser',
    browse: 'Browse tools',
    trust: ['No upload', 'Free', 'Batch ZIP'],
    imageAlt: 'Foto — free image tools that run in the browser',
  },
  ru: {
    skip: 'К содержанию',
    language: 'Язык',
    privacy: 'Конфиденциальность',
    tagline: 'Бесплатные инструменты для изображений. Файлы не уходят с устройства.',
    breadcrumb: 'Навигация',
    related: 'Похожие инструменты',
    allTools: 'Все инструменты',
    kicker: 'В вашем браузере',
    browse: 'К инструментам',
    trust: ['Без загрузки', 'Бесплатно', 'Пакет в ZIP'],
    imageAlt: 'Foto — бесплатные инструменты для изображений в браузере',
  },
} as const

type ToolCopy = {
  dropTitle: string
  dropTitleTouch: string
  choose: string
  addMore: string
  clear: string
  localNote: string
  heicHint: string
  quality: string
  format: string
  download: string
  downloadZip: string
  save: string
  remove: string
  before: string
  after: string
  width: string
  height: string
  percent: string
  pixels: string
  units: string
  lock: string
  scale: string
  resize: string
  crop: string
  cropHelp: string
  output: string
  flatten: string
  original: string
  jpg: string
  png: string
  webp: string
  presets: Record<PresetId, string>
  presetGroup: string
  filmstrip: string
  moveCrop: string
  handleNw: string
  handleNe: string
  handleSw: string
  handleSe: string
  wrongType: string
  tryInstead: string
  or: string
  tooMany: string
  decode: string
  heicFail: string
  encode: string
  tooLarge: string
  webpFail: string
  scaled: string
  clamped: string
  working: string
  opening: string
  ready: string
  readyPartial: string
  results: string
  options: string
  lockNote: string
  batchNote: string
  fatal: string
  dimensions: string
}

export const toolText: Record<Locale, ToolCopy> = {
  en: {
    dropTitle: 'Drop images here',
    dropTitleTouch: 'Tap to choose images',
    choose: 'Choose files',
    addMore: 'Add more',
    clear: 'Clear',
    localNote: 'Processed in this browser. Nothing is uploaded.',
    heicHint: 'The first HEIC conversion downloads a decoder that is part of this site. The photo itself is not uploaded.',
    quality: 'Quality',
    format: 'Format',
    download: 'Download',
    downloadZip: 'Download ZIP',
    save: 'Save',
    remove: 'Remove {name}',
    before: 'Before',
    after: 'After',
    width: 'Width',
    height: 'Height',
    percent: 'Percent',
    pixels: 'Pixels',
    units: 'Units',
    lock: 'Keep aspect ratio',
    scale: 'Scale',
    resize: 'Resize',
    crop: 'Crop',
    cropHelp: 'Drag the frame to move it. Drag a corner to resize. Arrow keys nudge the frame.',
    output: 'Output',
    flatten: 'Transparent pixels become white in JPG.',
    original: 'Original',
    jpg: 'JPG',
    png: 'PNG',
    webp: 'WebP',
    presets: {
      'ig-post': 'Instagram post · 1:1',
      'ig-portrait': 'Instagram portrait · 4:5',
      'ig-story': 'Instagram story · 9:16',
      'yt-thumb': 'YouTube thumbnail · 16:9',
      'fb-post': 'Facebook post · 1.91:1',
      'x-post': 'X post · 16:9',
      'li-post': 'LinkedIn post · 1.91:1',
      pin: 'Pinterest pin · 2:3',
      tiktok: 'TikTok · 9:16',
    },
    presetGroup: 'Crop preset',
    filmstrip: 'Selected images',
    moveCrop: 'Crop frame. Drag to move. Arrow keys nudge.',
    handleNw: 'Resize from the top left',
    handleNe: 'Resize from the top right',
    handleSw: 'Resize from the bottom left',
    handleSe: 'Resize from the bottom right',
    wrongType: 'This tool accepts {label} files.',
    tryInstead: 'Try {list} instead.',
    or: 'or',
    tooMany: 'Only the first {max} files were added.',
    decode: 'Could not read this image.',
    heicFail: 'This browser could not decode that HEIC file. Try Safari, or export a JPG from Photos. The original stays on your device.',
    encode: 'Could not create the file.',
    tooLarge: 'This image is too large for the browser to process.',
    webpFail: 'This browser cannot encode WebP.',
    scaled: 'Long side limited to {max}px so this tab stays responsive.',
    clamped: 'Output was limited to {max}px on the long side.',
    working: 'Working on {n} of {total}…',
    opening: 'Opening {name}…',
    ready: '{ok} ready.',
    readyPartial: '{ok} ready. {bad} failed.',
    results: 'Results',
    options: 'Settings',
    lockNote: 'Each image keeps its own aspect ratio.',
    batchNote: 'The same settings apply to every file.',
    fatal: 'This tool could not start. Reload the page and try again.',
    dimensions: '{w}×{h}',
  },
  ru: {
    dropTitle: 'Перетащите изображения сюда',
    dropTitleTouch: 'Нажмите, чтобы выбрать изображения',
    choose: 'Выбрать файлы',
    addMore: 'Добавить ещё',
    clear: 'Очистить',
    localNote: 'Обработка в этом браузере. Файлы никуда не отправляются.',
    heicHint: 'При первой конвертации HEIC сайт один раз скачивает декодер. Само фото не отправляется.',
    quality: 'Качество',
    format: 'Формат',
    download: 'Скачать',
    downloadZip: 'Скачать ZIP',
    save: 'Сохранить',
    remove: 'Убрать {name}',
    before: 'До',
    after: 'После',
    width: 'Ширина',
    height: 'Высота',
    percent: 'Проценты',
    pixels: 'Пиксели',
    units: 'Единицы',
    lock: 'Сохранять пропорции',
    scale: 'Масштаб',
    resize: 'Изменить размер',
    crop: 'Кадрировать',
    cropHelp: 'Перетащите рамку, чтобы сдвинуть её. Угол меняет размер. Стрелки двигают кадр.',
    output: 'На выходе',
    flatten: 'Прозрачные пиксели в JPG станут белыми.',
    original: 'Как есть',
    jpg: 'JPG',
    png: 'PNG',
    webp: 'WebP',
    presets: {
      'ig-post': 'Пост в Instagram · 1:1',
      'ig-portrait': 'Портрет Instagram · 4:5',
      'ig-story': 'Сторис Instagram · 9:16',
      'yt-thumb': 'Превью YouTube · 16:9',
      'fb-post': 'Пост Facebook · 1.91:1',
      'x-post': 'Пост в X · 16:9',
      'li-post': 'Пост LinkedIn · 1.91:1',
      pin: 'Пин Pinterest · 2:3',
      tiktok: 'TikTok · 9:16',
    },
    presetGroup: 'Формат кадра',
    filmstrip: 'Выбранные изображения',
    moveCrop: 'Рамка кадра. Перетащите, чтобы сдвинуть. Стрелки двигают кадр.',
    handleNw: 'Изменить размер с верхнего левого угла',
    handleNe: 'Изменить размер с верхнего правого угла',
    handleSw: 'Изменить размер с нижнего левого угла',
    handleSe: 'Изменить размер с нижнего правого угла',
    wrongType: 'Этот инструмент принимает только файлы {label}.',
    tryInstead: 'Попробуйте {list}.',
    or: 'или',
    tooMany: 'Добавлены только первые {max} файлов.',
    decode: 'Не удалось прочитать это изображение.',
    heicFail: 'Браузер не смог открыть этот HEIC. Попробуйте Safari или сохраните JPG из приложения «Фото». Оригинал остаётся на устройстве.',
    encode: 'Не удалось создать файл.',
    tooLarge: 'Изображение слишком большое для этого браузера.',
    webpFail: 'Этот браузер не умеет сохранять WebP.',
    scaled: 'Длинная сторона уменьшена до {max}px, чтобы вкладка не зависла.',
    clamped: 'Длинная сторона результата ограничена {max}px.',
    working: 'Обработка {n} из {total}…',
    opening: 'Открываем {name}…',
    ready: 'Готово: {ok}.',
    readyPartial: 'Готово: {ok}. Не удалось: {bad}.',
    results: 'Результаты',
    options: 'Настройки',
    lockNote: 'Пропорции сохраняются у каждого изображения.',
    batchNote: 'Одни и те же настройки применяются ко всем файлам.',
    fatal: 'Инструмент не запустился. Обновите страницу и попробуйте снова.',
    dimensions: '{w}×{h}',
  },
}
