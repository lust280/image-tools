import type { Doc, Faq, ToolDoc } from './content'
import { site } from '../../site.config'

function faqEntity(faqs: Faq[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.aText },
    })),
  }
}

function offer() {
  return { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
}

export function toolJsonLd(tool: ToolDoc, url: string, homeUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: tool.h1,
        url,
        description: tool.description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript and a current browser.',
        offers: offer(),
        isAccessibleForFree: true,
        inLanguage: tool.locale,
        publisher: { '@type': 'Organization', name: site.name, url: homeUrl },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.name, item: homeUrl },
          { '@type': 'ListItem', position: 2, name: tool.title, item: url },
        ],
      },
      faqEntity(tool.faqs),
    ],
  }
}

export function homeJsonLd(doc: Doc, url: string, tools: { title: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: site.name,
        url,
        description: doc.description,
        inLanguage: doc.locale,
      },
      {
        '@type': 'WebApplication',
        name: site.name,
        url,
        description: doc.description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: offer(),
        isAccessibleForFree: true,
        inLanguage: doc.locale,
        featureList: tools.map((tool) => tool.title),
      },
      {
        '@type': 'ItemList',
        itemListElement: tools.map((tool, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: tool.title,
          url: tool.url,
        })),
      },
      faqEntity(doc.faqs),
    ],
  }
}

export function pageJsonLd(doc: Doc, url: string, homeUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: doc.h1,
        description: doc.description,
        url,
        inLanguage: doc.locale,
        isPartOf: { '@type': 'WebSite', name: site.name, url: homeUrl },
      },
      ...(doc.faqs.length ? [faqEntity(doc.faqs)] : []),
    ],
  }
}
