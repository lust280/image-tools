---
title: "Image resizer"
seoTitle: "Resize images by pixels or percent — free | Foto"
description: "Resize JPG, PNG, and WebP images by pixels or percent in your browser. Keep the aspect ratio, process a batch, and download a ZIP."
h1: "Resize an image"
summary: "Change width and height by pixels or by percent. Aspect ratio stays locked unless you turn that off."
order: 40
icon: "resize"
kind: "resize"
accept: [".jpg", ".jpeg", ".png", ".webp"]
acceptLabel: "JPG, PNG, or WebP"
outputs: ["original", "jpg", "png", "webp"]
defaultOutput: "original"
defaultQuality: 90
related: ["crop-image", "image-compressor", "jpg-to-png"]
---

Profile forms, marketplaces, and chat apps often want a smaller pixel size, not just a smaller file. This resizer scales each image on your device. Percent mode is the simplest way to shrink a whole batch. Pixel mode sets an exact width or height and, with the lock on, computes the other side from each photo’s own shape.

## How to resize

1. Add your images. The first one shows its current size.
2. Choose percent or pixels. Leave “Keep aspect ratio” on unless you mean to stretch.
3. Tap Resize, check the new dimensions, then download or save a ZIP.

Very large photos are limited to 4096 pixels on the long side so a phone tab does not run out of memory.

## FAQ

### Will this distort the photo?

Not while aspect lock is on. Percent mode scales both sides together. Pixel mode uses the width or the height you last edited and fits the other side. Turn the lock off only when you want an exact box.

### Can I resize several images at once?

Yes. The same percent, or the same locked pixel rule, is applied to each file. Download ZIP saves them together.

### Does resizing upload the file?

No. Scaling happens in this browser. You can [compress](tool:image-compressor) afterwards if the file is still heavy.

### Why is the output smaller than the number I typed?

The long side is capped at 4096 pixels. That protects phones from canvases they cannot allocate. For social crops at exact sizes like 1080×1920, use [Crop for social media](tool:crop-image).
