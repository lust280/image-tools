# Content

Marketing copy lives here so it can be edited without touching the tool code. English is the source locale. Russian mirrors the same slugs under `ru/`.

```
data/en/home.md
data/en/privacy.md
data/en/tools/<slug>.md
data/ru/home.md
data/ru/privacy.md
data/ru/tools/<slug>.md
data/affiliate.json
```

Tool filenames are the URL slugs (`heic-to-jpg.md` → `/heic-to-jpg/` and `/ru/heic-to-jpg/`). Both locales must contain the same slugs. The build fails if a slug or a `related` entry is missing.

## Tool frontmatter

```yaml
title: "HEIC to JPG"          # card title
seoTitle: "… | Foto"          # <title>
description: "…"              # meta description, about 150 characters
h1: "Convert HEIC to JPG"
summary: "One sentence under the heading and on the home card."
order: 10
icon: "heic"                  # heic, jpg, png, webp, compress, resize, crop, convert
kind: "convert"               # convert, compress, resize, crop
accept: [".heic", ".heif"]    # extensions, with the leading dot
acceptLabel: "HEIC"
outputs: ["jpg"]              # jpg, png, webp, original
defaultOutput: "jpg"
defaultQuality: 90            # 1–100
decode: "heic"                # only for HEIC; omit for everything else
related: ["png-to-jpg"]
```

## Body

Use normal Markdown. The build splits the body on a heading written exactly as `## FAQ` (keep that marker in both languages).

- Text before the first `##` is the intro.
- The next section is the how-to. Its heading can be translated.
- `## FAQ` then `### Question` blocks. At least two questions. Answers are Markdown paragraphs.

Internal links, so a later base-path change still works:

- `[PNG to JPG](tool:png-to-jpg)`
- `[Privacy](site:privacy)`
- `[Home](site:home)`

Do not use root-relative links like `/png-to-jpg/`. They miss the GitHub Pages prefix.

`data/affiliate.json` is the partner-link copy. It is not rendered until `features.affiliate.enabled` is true in `shared/features.config.ts`.
