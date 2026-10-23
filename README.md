# Foto

Free image tools that run in the browser. Nothing is uploaded. English lives at the site root, Russian under `/ru/`.

Default public URL: <https://lust280.github.io/image-tools/>

## Scripts

```bash
npm install
npm run dev      # http://127.0.0.1:4321/image-tools/
npm run build    # writes dist/, including sitemap.xml and robots.txt
npm run preview
```

Node 22.23.4 or newer. Astro 7 refuses older 22.x releases, including the 22.23.3 build still cached on GitHub-hosted runners.

## Layout

```
site.config.ts          public URL (one setting) and verification tokens
shared/                 header, footer, network list, tokens, monetization flags
data/                   tool copy, FAQs, and affiliate text
src/pages               routes
src/scripts             in-browser image tools
src/components          page templates
public/                 favicon and social image
.github/workflows       GitHub Pages deploy
```

`shared/` is meant to be copied into the next site in the network. Add that site to `shared/network.config.ts` (`sites`), then copy the folder. The block title is “More free tools from our network”. The current site’s link follows `site.config.ts`, so it stays on the right host and language.

## Add a tool

1. Add `data/en/tools/<slug>.md` and `data/ru/tools/<slug>.md` with the same slug. The format is in [data/README.md](data/README.md).
2. Set `kind` to `convert`, `compress`, `resize`, or `crop`. The page mounts the matching in-browser tool from that field. No new React app is required.
3. Point `related` at existing slugs.
4. `npm run build`.

Processing stays on the device: canvas for JPG, PNG, and WebP, and `heic-to` only on the HEIC page when the browser cannot decode HEIC itself (Safari usually can). Several files download as a ZIP.

## Custom domain

Canonical URLs, Open Graph, hreflang, asset prefixes, and the sitemap all come from one value, `SITE_ROOT` in `site.config.ts`.

| | `SITE_ROOT` | Result |
| --- | --- | --- |
| GitHub Pages project (default) | `https://lust280.github.io/image-tools` | origin `https://lust280.github.io`, base `/image-tools` |
| Custom domain at the root | `https://your.domain` | origin `https://your.domain`, base `/` |

You can set the same value without editing the file:

```bash
PUBLIC_SITE_ROOT=https://your.domain npm run build
```

The Pages workflow forwards the `PUBLIC_SITE_ROOT` repository variable when it is set.

To attach the domain:

1. Change `SITE_ROOT` (or the env var) to `https://your.domain`.
2. Add `public/CNAME` containing only the hostname, for example `your.domain`.
3. Push to `main`. The workflow deploys `dist/`, and GitHub Pages reads the CNAME file from that artifact.
4. In the DNS host, point the domain at GitHub Pages, then confirm the domain under Settings → Pages.
5. In Google Search Console and Bing Webmaster Tools, add the new property and submit the new sitemap.

Leave the base at `/image-tools` only while the site is served from `https://lust280.github.io/image-tools/`. On a root custom domain that prefix would 404 the CSS and images.

## Sitemap and verification

After a build, `dist/sitemap.xml` is a single urlset (easy to submit; no sitemap index) and `dist/robots.txt` points at it.

- GitHub Pages: `https://lust280.github.io/image-tools/sitemap.xml`
- Custom root domain: `https://your.domain/sitemap.xml`

Submit that exact URL in Google Search Console (Sitemaps) and Bing Webmaster Tools (Sitemaps). Each URL includes `hreflang` alternates for `en`, `ru`, and `x-default`.

To verify the property, paste the tokens into `site.verification` in `site.config.ts`, or set `PUBLIC_GOOGLE_SITE_VERIFICATION` and `PUBLIC_BING_SITE_VERIFICATION`. Empty values omit the tags. They render as `google-site-verification` and `msvalidate.01`.

## Monetization

All of these are off. A production build contains no ad script, analytics script, donate link, or affiliate link until you flip the matching flag.

In `shared/features.config.ts`:

- `adsense` — client id and slot ids. Slots: `top`, `afterTool`, `footer`.
- `analytics` — `provider: "plausible"` or `"gtag"`, plus domain or measurement id.
- `donate` — set `enabled: true` and a full URL (Buy Me a Coffee or similar). The label is translated. The button sits in the footer.
- `affiliate` — set `enabled: true`. Link text and URLs live in `data/affiliate.json`. Tool pages render them with `rel="sponsored nofollow"`. Replace the sample Canva and Photoshop URLs with your own affiliate links before enabling.

Update `data/*/privacy.md` before you turn ads or analytics on.

## Deploy

Pushes to `main` run `.github/workflows/pages.yml` (`configure-pages` with `enablement: true`, `upload-pages-artifact`, `deploy-pages`). The site is built with the base path from `site.config.ts`.

`enablement` can fail on the default `GITHUB_TOKEN` (GitHub requires a separate token to turn Pages on). If the first run stops there, set Settings → Pages → Build and deployment → GitHub Actions, then re-run the workflow. After it succeeds, the site is at <https://lust280.github.io/image-tools/>.
