const markCurrentTocEntries = () => {
  const contents = document.querySelectorAll<HTMLElement>(".toc-content")
  contents.forEach((content) => {
    const anchors = Array.from(content.querySelectorAll<HTMLAnchorElement>("a"))
    if (anchors.length === 0) return
    anchors.forEach((anchor) => anchor.classList.remove("is-current"))
    const inViewAnchors = anchors.filter((anchor) => anchor.classList.contains("in-view"))
    const currentAnchor = inViewAnchors[inViewAnchors.length - 1]
    if (currentAnchor) {
      currentAnchor.classList.add("is-current")
    }
  })
}

const observer = new IntersectionObserver((entries) => {
  let shouldUpdateCurrent = false
  for (const entry of entries) {
    const slug = entry.target.id
    const tocEntryElements = document.querySelectorAll(`a[data-for="${slug}"]`)
    const windowHeight = entry.rootBounds?.height
    if (windowHeight && tocEntryElements.length > 0) {
      if (entry.boundingClientRect.y < windowHeight) {
        tocEntryElements.forEach((tocEntryElement) => tocEntryElement.classList.add("in-view"))
      } else {
        tocEntryElements.forEach((tocEntryElement) => tocEntryElement.classList.remove("in-view"))
      }
      shouldUpdateCurrent = true
    }
  }
  if (shouldUpdateCurrent) {
    markCurrentTocEntries()
  }
})

function toggleToc(this: HTMLElement) {
  this.classList.toggle("collapsed")
  this.setAttribute(
    "aria-expanded",
    this.getAttribute("aria-expanded") === "true" ? "false" : "true",
  )
  const content = this.nextElementSibling as HTMLElement | undefined
  if (!content) return
  content.classList.toggle("collapsed")
}

function setupToc() {
  for (const toc of document.getElementsByClassName("toc")) {
    const button = toc.querySelector(".toc-header")
    const content = toc.querySelector(".toc-content")
    if (!button || !content) return
    button.addEventListener("click", toggleToc)
    window.addCleanup(() => button.removeEventListener("click", toggleToc))
  }
}

document.addEventListener("nav", () => {
  setupToc()

  // update toc entry highlighting
  observer.disconnect()
  const headers = document.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")
  headers.forEach((header) => observer.observe(header))
  markCurrentTocEntries()
})
