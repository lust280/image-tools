export type NetworkLocale = 'en' | 'ru'

export type NetworkSite = {
  id: string
  name: string
  url: string
  description: Record<NetworkLocale, string>
  /** True only for the site this repository builds. */
  current?: boolean
}

export const network = {
  name: 'Foto',
  intro: {
    en: 'Small, free utilities that run in the browser.',
    ru: 'Небольшие бесплатные утилиты, которые работают в браузере.',
  },
  moreLabel: {
    en: 'More free tools from our network',
    ru: 'Другие бесплатные инструменты нашей сети',
  },
  thisSiteLabel: {
    en: 'This site',
    ru: 'Этот сайт',
  },
  sites: [
    {
      id: 'image-tools',
      name: 'Foto',
      // Ignored while current is true. The live URL comes from site.config.ts.
      url: 'https://lust280.github.io/image-tools/',
      description: {
        en: 'Convert, compress, resize, and crop images in your browser. Nothing is uploaded.',
        ru: 'Конвертация, сжатие, размер и кадрирование изображений в браузере. Файлы никуда не отправляются.',
      },
      current: true,
    },
  ] satisfies NetworkSite[],
}
