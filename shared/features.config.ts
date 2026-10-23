/**
 * Monetization and measurement. Ads, donate, and affiliate ship off
 * until the matching `enabled` flag is true. Analytics renders only for
 * the selected provider.
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
    enabled: true,
    provider: 'goatcounter' as 'none' | 'plausible' | 'gtag' | 'goatcounter',
    domain: '',
    measurementId: '',
    /** GoatCounter count URL, used when provider is "goatcounter". */
    endpoint: 'https://foto-tools.goatcounter.com/count',
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
