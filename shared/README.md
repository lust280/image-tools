# Shared network UI

Copy this folder into a sibling site when you add another free browser tool.

- `tokens.css` — colors, type, spacing. Import it before any other stylesheet.
- `layout.css` — header, footer, language switch, network list, donate chip.
- `network.config.ts` — the “More free tools from our network” list. Add a site here, then copy the updated file to each repo (or later publish this folder as a package).
- `features.config.ts` — AdSense, analytics, donate, and the affiliate on/off switch. Ads, donate, and affiliate default to off. This copy counts visits with GoatCounter. Affiliate wording lives in the site’s `data/affiliate.json`, not here.
- `components/` — `SiteHeader`, `SiteFooter`, `NetworkBlock`, `DonateLink`, `AdSlot`, `Analytics`, `Seo`.

Public URLs do not live here. Each site has its own `site.config.ts`.
