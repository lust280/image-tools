---
seoTitle: "Privacy — Foto image tools"
description: "Foto processes images in your browser. Photos are not uploaded. Visits are counted with GoatCounter: no cookies and no personal data."
h1: "Privacy"
summary: "Your photos stay on this device. This page explains what the site actually loads."
---

Foto is a static website. The tools do not have an account, a database, or an upload endpoint.

## What happens to a photo

When you pick a file, the browser reads it on this device. Resizing, cropping, and format conversion use the browser’s own graphics features. HEIC files that the browser cannot open use a decoder script that is downloaded from this same site and then run locally. The photo bytes are not part of that download, and they are not posted anywhere.

The site is hosted as static files. Loading a page requests HTML, CSS, and JavaScript from the host. That is the network traffic. Processing a picture does not add a request that contains the picture.

## Ads and measurement

This site does not ship advertising. It uses GoatCounter, a privacy-friendly analytics service with no cookies and no personal data tracking.

Questions and bug reports go to the [GitHub repository](https://github.com/lust280/image-tools).

## FAQ

### Do you see the images I convert?

No. Conversion does not send the file to a server.

### Do you use cookies?

The tools do not set tracking cookies. Your browser may keep the page itself in its normal cache so the next visit loads faster.

### What should I know about HEIC?

The HEIC page may download a decoder (a few megabytes) the first time you convert. That file is code, not your photo. After it loads, decoding still happens on your device.
