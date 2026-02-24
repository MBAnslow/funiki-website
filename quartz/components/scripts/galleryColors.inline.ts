const GALLERY_IMG_SELECTOR = ".gallery-custom img"
const CANVAS_SCALE = 48

type RGB = [number, number, number]

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function extractThreeColors(img: HTMLImageElement): [RGB, RGB, RGB] {
  const canvas = document.createElement("canvas")
  const aspect = img.naturalWidth / img.naturalHeight
  canvas.width = Math.round(CANVAS_SCALE * aspect)
  canvas.height = CANVAS_SCALE

  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx)
    return [
      [30, 30, 30],
      [120, 120, 120],
      [200, 200, 200],
    ]

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

  const pixels: { r: number; g: number; b: number; lum: number }[] = []
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2]
    pixels.push({ r, g, b, lum: luminance(r, g, b) })
  }

  pixels.sort((a, b) => a.lum - b.lum)

  const third = Math.floor(pixels.length / 3)

  const avgSlice = (start: number, end: number): RGB => {
    let rT = 0,
      gT = 0,
      bT = 0
    for (let i = start; i < end; i++) {
      rT += pixels[i].r
      gT += pixels[i].g
      bT += pixels[i].b
    }
    const n = end - start
    return [Math.round(rT / n), Math.round(gT / n), Math.round(bT / n)]
  }

  return [avgSlice(0, third), avgSlice(third, third * 2), avgSlice(third * 2, pixels.length)]
}

function rgb(c: RGB): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

function applyGradients() {
  const images = document.querySelectorAll<HTMLImageElement>(GALLERY_IMG_SELECTOR)
  images.forEach((img) => {
    const caption = img.parentElement?.querySelector<HTMLElement>(".thumb-caption")
    if (!caption) return

    const apply = () => {
      if (!img.naturalWidth) return
      const [dark, mid, light] = extractThreeColors(img)
      const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
      caption.style.background = `linear-gradient(to bottom, ${rgb(dark)} 0%, ${rgb(mid)} 50%, ${rgba(light, 0)} 100%)`
    }

    if (img.complete && img.naturalWidth) {
      apply()
    } else {
      img.addEventListener("load", apply, { once: true })
    }
  })
}

const setupGalleryColors = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return

  const handleNav = () => applyGradients()

  document.addEventListener("nav", handleNav)

  if (typeof window.addCleanup === "function") {
    window.addCleanup(() => document.removeEventListener("nav", handleNav))
  }

  applyGradients()
}

setupGalleryColors()
