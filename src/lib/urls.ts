import { absoluteUrl, pageHref } from '../../site.config'

export type Locale = 'en' | 'ru'

export function localePath(path: string, locale: Locale): string {
  const bare = path.replace(/^\/ru(?=\/|$)/, '') || '/'
  const normalized = bare.endsWith('/') ? bare : `${bare}/`
  if (locale === 'en') return normalized
  return normalized === '/' ? '/ru/' : `/ru${normalized}`
}

export function homePath(locale: Locale): string {
  return locale === 'ru' ? '/ru/' : '/'
}

export function privacyPath(locale: Locale): string {
  return locale === 'ru' ? '/ru/privacy/' : '/privacy/'
}

export function toolPath(locale: Locale, slug: string): string {
  return locale === 'ru' ? `/ru/${slug}/` : `/${slug}/`
}

export function hrefFor(path: string): string {
  return pageHref(path)
}

export function canonical(path: string): string {
  return absoluteUrl(path)
}

export function alternates(path: string): { hreflang: string; href: string }[] {
  const en = absoluteUrl(localePath(path, 'en'))
  const ru = absoluteUrl(localePath(path, 'ru'))
  return [
    { hreflang: 'en', href: en },
    { hreflang: 'ru', href: ru },
    { hreflang: 'x-default', href: en },
  ]
}

export function switcher(locale: Locale, path: string) {
  return [
    {
      code: 'EN',
      label: 'English',
      hreflang: 'en',
      href: pageHref(localePath(path, 'en')),
      current: locale === 'en',
    },
    {
      code: 'RU',
      label: 'Русский',
      hreflang: 'ru',
      href: pageHref(localePath(path, 'ru')),
      current: locale === 'ru',
    },
  ]
}
