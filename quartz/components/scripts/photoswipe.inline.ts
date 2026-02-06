const LIGHTBOX_SELECTOR = ".pswp-gallery"
const LIGHTBOX_CHILDREN = "a"
const STYLESHEET_URL = "https://unpkg.com/photoswipe@5/dist/photoswipe.css"
const LIGHTBOX_MODULE_URL = "https://unpkg.com/photoswipe@5/dist/photoswipe-lightbox.esm.js"
const CORE_MODULE_URL = "https://unpkg.com/photoswipe@5/dist/photoswipe.esm.js"

type CleanupFn = () => void

const registerCleanup = (fn: CleanupFn) => {
  if (typeof window === "undefined") {
    return
  }
  if (typeof window.addCleanup === "function") {
    window.addCleanup(fn)
  } else {
    window.addEventListener(
      "beforeunload",
      () => {
        fn()
      },
      { once: true },
    )
  }
}

const ensureStylesheet = () => {
  if (typeof document === "undefined") {
    return
  }
  if (document.querySelector('link[data-photoswipe="true"]')) {
    return
  }
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = STYLESHEET_URL
  link.dataset.photoswipe = "true"
  document.head.appendChild(link)
}

const createLightbox = async () => {
  const galleries = document.querySelectorAll(LIGHTBOX_SELECTOR)
  if (!galleries.length) {
    return undefined
  }

  ensureStylesheet()

  const galleryLinks = document.querySelectorAll<HTMLAnchorElement>(
    `${LIGHTBOX_SELECTOR} ${LIGHTBOX_CHILDREN}`,
  )
  galleryLinks.forEach((link) => {
    link.removeAttribute("target")
    link.dataset.routerIgnore = "true"
    link.dataset.noPopover = "true"
  })

  const { default: PhotoSwipeLightbox } = await import(/* @vite-ignore */ LIGHTBOX_MODULE_URL)

  const lightbox = new PhotoSwipeLightbox({
    gallery: LIGHTBOX_SELECTOR,
    children: LIGHTBOX_CHILDREN,
    pswpModule: () => import(/* @vite-ignore */ CORE_MODULE_URL),
    paddingFn: () => ({ top: 10, bottom: 10, left: 10, right: 10 }),
    zoom: false,
    bgOpacity: 0.92,
  })

  lightbox.init()
  return lightbox
}

const setup = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return
  }

  let lightbox: { destroy: () => void } | undefined

  const refreshLightbox = async () => {
    if (lightbox) {
      lightbox.destroy()
      lightbox = undefined
    }
    lightbox = await createLightbox()
  }

  const handleNav = () => {
    void refreshLightbox()
  }

  document.addEventListener("nav", handleNav)
  registerCleanup(() => {
    document.removeEventListener("nav", handleNav)
    if (lightbox) {
      lightbox.destroy()
      lightbox = undefined
    }
  })

  void refreshLightbox()
}

setup()
