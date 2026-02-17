// Default reader mode to on for desktop only
const DESKTOP_BREAKPOINT = 1200
let isReaderMode = window.innerWidth >= DESKTOP_BREAKPOINT

const emitReaderModeChangeEvent = (mode: "on" | "off") => {
  const event: CustomEventMap["readermodechange"] = new CustomEvent("readermodechange", {
    detail: { mode },
  })
  document.dispatchEvent(event)
}

const applyReaderModeState = () => {
  const mode = isReaderMode ? "on" : "off"
  document.documentElement.setAttribute("reader-mode", mode)
  emitReaderModeChangeEvent(mode)
}

applyReaderModeState()

document.addEventListener("nav", () => {
  const switchReaderMode = () => {
    isReaderMode = !isReaderMode
    applyReaderModeState()
  }

  for (const readerModeButton of document.getElementsByClassName("readermode")) {
    readerModeButton.addEventListener("click", switchReaderMode)
    window.addCleanup(() => readerModeButton.removeEventListener("click", switchReaderMode))
  }

  // Set initial state
  applyReaderModeState()
})
