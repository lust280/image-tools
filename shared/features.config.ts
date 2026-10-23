/**
 * Monetization and measurement. Everything here ships off.
 * The built HTML contains no ad, analytics, donate, or affiliate links
 * until the matching `enabled` flag is true.
 *
 * Donate URL lives here. Affiliate link text lives in data/affiliate.json.
 */
export const features = {
  adsense: {
    enabled: false,
    clientId: '',
    slots: {
      top: '',
      afterTool: '',
      footer: '',
    },
  },
  analytics: {
    enabled: false,
    provider: 'none' as 'none' | 'plausible' | 'gtag',
    domain: '',
    measurementId: '',
  },
  donate: {
    enabled: false,
    /** Full https URL, for example https://buymeacoffee.com/yourname */
    url: '',
    label: {
      en: 'Buy me a coffee',
      ru: 'Угостить кофе',
    },
  },
  affiliate: {
    /** Copy and links: data/affiliate.json */
    enabled: false,
  },
}
