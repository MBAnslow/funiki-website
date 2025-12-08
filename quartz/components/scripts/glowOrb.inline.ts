const FADE_IN_HOLD_MS = 350
const LOOP_DELAY_MS = 1200
const MAX_TRAJECTORY_POINTS = 8
const MIN_DEBUG_POINT_DISTANCE = 32
const HOVER_BOX_HORIZONTAL_PAD = 80
const HOVER_BOX_EXTRA_TOP = 20
const HOVER_BOX_EXTRA_BOTTOM = 30
const HOLD_SEGMENT_DURATION = 1000
const FIRST_MOVE_DURATION = 1500
const UNDERLINE_SEGMENT_DURATION = 1500
const RANDOM_SEGMENT_MIN_DURATION = 800
const RANDOM_SEGMENT_MAX_DURATION = 1200
const RIPPLE_GROUP_INTERVAL_MIN = 4200
const RIPPLE_GROUP_INTERVAL_MAX = 6200
const RIPPLE_GROUP_REST_MS = 1400
const RIPPLE_INITIAL_DELAY_MS = 1600
const RIPPLE_RETRY_DELAY_MS = 600
const RIPPLE_GROUP_SIZE = 4
const RIPPLE_STAGGER_MS = 320
const RIPPLE_DURATION_MS = 1000
const RIPPLE_EDGE_PADDING = 140
const RIPPLE_MIN_SCALE = 1.4
const RIPPLE_MAX_SCALE = 2.1
const RIPPLE_INITIAL_SCALE = 0.35
const RIPPLE_LETTER_EFFECT_MS = 2000

type Point = { x: number; y: number }
type PathSegment = {
  start: Point
  control1: Point
  control2: Point
  end: Point
  duration: number
}

type CurvedSegmentOptions = {
  curvatureBoost?: number
  horizontalDriftMultiplier?: number
  terminalLiftMultiplier?: number
}

type PushPointOptions = {
  minDistance?: number
}

type HoverSampleBox = {
  left: number
  top: number
  right: number
  bottom: number
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)
const DEFAULT_ORB_HUE = 48
const DYNAMIC_HUE_START_POINT = 2
const MIN_HUE_VARIATION = 15
const READER_MODE_LOCK_CLASS = "orb-reader-lock"
const ENABLE_ORB_DEBUG = false
const SVG_NS = "http://www.w3.org/2000/svg"
const randomHue = () => Math.floor(randomBetween(0, 360))

const registerCleanup = (fn: () => void) => {
  if (typeof window === "undefined") return
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

const evaluateCubic = (segment: PathSegment, t: number): Point => {
  const { start, control1, control2, end } = segment
  const mt = 1 - t
  const mt2 = mt * mt
  const t2 = t * t
  const a = mt2 * mt
  const b = 3 * mt2 * t
  const c = 3 * mt * t2
  const d = t * t2
  return {
    x: a * start.x + b * control1.x + c * control2.x + d * end.x,
    y: a * start.y + b * control1.y + c * control2.y + d * end.y,
  }
}

const createLinearSegment = (start: Point, end: Point, duration: number): PathSegment => {
  const control1: Point = {
    x: start.x + (end.x - start.x) / 3,
    y: start.y + (end.y - start.y) / 3,
  }
  const control2: Point = {
    x: start.x + (2 * (end.x - start.x)) / 3,
    y: start.y + (2 * (end.y - start.y)) / 3,
  }
  return {
    start,
    control1,
    control2,
    end,
    duration,
  }
}

const createCurvedSegment = (
  start: Point,
  end: Point,
  bias: "down" | "up",
  duration: number,
  options: CurvedSegmentOptions = {},
): PathSegment => {
  const { curvatureBoost = 1, horizontalDriftMultiplier = 1, terminalLiftMultiplier = 1 } = options
  const horizontalRange = 40 * horizontalDriftMultiplier
  const offsetY =
    (bias === "down" ? randomBetween(12, 28) : randomBetween(-26, -10)) * curvatureBoost
  const control1: Point = {
    x: start.x + randomBetween(-horizontalRange, horizontalRange),
    y: start.y + offsetY,
  }
  const control2VerticalRange = bias === "down" ? [-18, 6] : [12, 32]
  const control2: Point = {
    x: end.x + randomBetween(-horizontalRange, horizontalRange),
    y:
      end.y +
      randomBetween(control2VerticalRange[0], control2VerticalRange[1]) * terminalLiftMultiplier,
  }
  return {
    start,
    control1,
    control2,
    end,
    duration,
  }
}

const LETTER_GLOW_DECAY_MS = 350
const letterGlowFadeTimers = new WeakMap<Element, number>()

const cancelLetterGlowFade = (el: Element) => {
  const timer = letterGlowFadeTimers.get(el)
  if (timer !== undefined) {
    window.clearTimeout(timer)
    letterGlowFadeTimers.delete(el)
  }
}

const scheduleLetterGlowFade = (el: Element) => {
  if (letterGlowFadeTimers.has(el)) return
  const timer = window.setTimeout(() => {
    el.classList.remove("orb-illuminated")
    letterGlowFadeTimers.delete(el)
  }, LETTER_GLOW_DECAY_MS)
  letterGlowFadeTimers.set(el, timer)
}

const highlightTargets = (targets: Element[], orbRect: DOMRect) => {
  for (const el of targets) {
    const rect = el.getBoundingClientRect()
    const overlaps =
      rect.left <= orbRect.right &&
      rect.right >= orbRect.left &&
      rect.top <= orbRect.bottom &&
      rect.bottom >= orbRect.top
    if (overlaps) {
      el.classList.add("orb-illuminated")
      cancelLetterGlowFade(el)
    } else {
      scheduleLetterGlowFade(el)
    }
  }
}

type DebugArtifacts = {
  overlay: HTMLElement
  markers: HTMLElement[]
}

type LetterPosition = {
  el: HTMLElement
  x: number
  y: number
}

const renderDebugPoints = (
  container: HTMLElement,
  orb: HTMLElement,
  points: Point[],
  segments: PathSegment[],
  enabled: boolean,
  contextRect: DOMRect,
): DebugArtifacts | null => {
  const existing = container.querySelector<HTMLElement>(".orb-debug-overlay[data-orb-runtime]")
  existing?.remove()
  if (!enabled) {
    return null
  }
  const overlay = document.createElement("div")
  overlay.className = "orb-debug-overlay"
  overlay.dataset.orbRuntime = "true"
  const markers: HTMLElement[] = []

  const pathSvg = document.createElementNS(SVG_NS, "svg")
  pathSvg.setAttribute("class", "orb-debug-path")
  pathSvg.setAttribute("width", "100%")
  pathSvg.setAttribute("height", "100%")
  pathSvg.setAttribute("viewBox", `0 0 ${contextRect.width} ${contextRect.height}`)
  const pathElement = document.createElementNS(SVG_NS, "path")
  pathElement.setAttribute("fill", "none")
  pathElement.setAttribute("stroke", "currentColor")
  pathElement.setAttribute("stroke-linecap", "round")
  pathElement.setAttribute("stroke-linejoin", "round")
  pathElement.setAttribute("stroke-dasharray", "6 6")

  const offsetX = orb.offsetWidth / 2
  const offsetY = orb.offsetHeight / 2
  const formatPoint = (point: Point) => `${point.x + offsetX},${point.y + offsetY}`

  let pathData = ""
  if (segments.length > 0) {
    segments.forEach((segment, idx) => {
      if (idx === 0) {
        pathData += `M${formatPoint(segment.start)} `
      }
      pathData += `C${formatPoint(segment.control1)} ${formatPoint(segment.control2)} ${formatPoint(segment.end)} `
    })
  } else if (points.length > 0) {
    pathData = points.map((point, idx) => `${idx === 0 ? "M" : "L"}${formatPoint(point)}`).join(" ")
  }
  const normalizedPathData = pathData.trim()
  pathElement.setAttribute("d", normalizedPathData.length > 0 ? normalizedPathData : "M0 0")
  pathSvg.append(pathElement)
  overlay.append(pathSvg)

  points.forEach((point, idx) => {
    const marker = document.createElement("div")
    marker.className = "orb-debug-point"
    marker.textContent = String(idx + 1)
    marker.style.left = `${point.x + offsetX}px`
    marker.style.top = `${point.y + offsetY}px`
    overlay.append(marker)
    markers.push(marker)
  })
  container.append(overlay)
  return { overlay, markers }
}

const landingRippleRegistry = new WeakMap<HTMLElement, () => void>()

type RippleFieldResult = {
  field: HTMLElement
  isSynthetic: boolean
}

const ensureRippleField = (container: HTMLElement): RippleFieldResult => {
  const existing = container.querySelector<HTMLElement>(".landing-ripple-field")
  if (existing) {
    return { field: existing, isSynthetic: false }
  }
  const field = document.createElement("div")
  field.className = "landing-ripple-field"
  field.setAttribute("aria-hidden", "true")
  field.dataset.rippleAuto = "true"
  container.prepend(field)
  return { field, isSynthetic: true }
}

const initLandingRipples = (container: HTMLElement) => {
  if (landingRippleRegistry.has(container)) return
  const { field, isSynthetic } = ensureRippleField(container)
  const timeouts = new Set<number>()
  const letterTargets = Array.from(
    container.querySelectorAll<HTMLElement>(".landing-title .glow-letter"),
  )
  const letterReleaseTimers = new WeakMap<HTMLElement, number>()
  let disposed = false

  const storeTimeout = (callback: () => void, delay: number) => {
    const handle = window.setTimeout(() => {
      timeouts.delete(handle)
      callback()
    }, delay)
    timeouts.add(handle)
    return handle
  }

  const cancelTimeout = (handle?: number) => {
    if (handle === undefined) return
    window.clearTimeout(handle)
    timeouts.delete(handle)
  }

  const queueLetterImpact = (letter: HTMLElement, delay: number) => {
    const safeDelay = Math.max(0, delay)
    storeTimeout(() => {
      if (letter.classList.contains("landing-letter-ripple")) {
        const pending = letterReleaseTimers.get(letter)
        if (pending === undefined) {
          return
        }
        const remaining = Math.max(0, RIPPLE_LETTER_EFFECT_MS - (performance.now() - pending))
        letterReleaseTimers.set(letter, remaining)
        return
      }
      letter.classList.add("landing-letter-ripple")
      const releaseHandle = storeTimeout(() => {
        letter.classList.remove("landing-letter-ripple")
        letterReleaseTimers.delete(letter)
      }, RIPPLE_LETTER_EFFECT_MS)
      letterReleaseTimers.set(letter, releaseHandle)
    }, safeDelay)
  }

  const impactLettersFromRipple = (
    letters: LetterPosition[],
    origin: Point,
    baseSize: number,
    rippleScale: number,
    rippleDelay: number,
  ) => {
    if (letters.length === 0) return
    const minRadius = (baseSize * RIPPLE_INITIAL_SCALE) / 2
    const maxRadius = (baseSize * rippleScale) / 2
    const radiusSpan = Math.max(1, maxRadius - minRadius)
    letters.forEach(({ el, x, y }) => {
      const distance = Math.hypot(x - origin.x, y - origin.y)
      if (distance > maxRadius) return
      const normalizedProgress = Math.max(0, Math.min(1, (distance - minRadius) / radiusSpan))
      const hitDelay = rippleDelay + normalizedProgress * RIPPLE_DURATION_MS
      queueLetterImpact(el, hitDelay)
    })
  }

  const cleanup = () => {
    if (disposed) return
    disposed = true
    timeouts.forEach((handle) => window.clearTimeout(handle))
    timeouts.clear()
    letterTargets.forEach((el) => {
      cancelTimeout(letterReleaseTimers.get(el))
      el.classList.remove("landing-letter-ripple")
    })
    field.querySelectorAll(".landing-ripple").forEach((node) => node.remove())
    if (isSynthetic && field.isConnected) {
      field.remove()
    }
    landingRippleRegistry.delete(container)
  }

  const emitRippleGroup = (): boolean => {
    if (disposed) return false
    const rect = field.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      return false
    }
    const minDimension = Math.min(rect.width, rect.height)
    const baseSize = randomBetween(minDimension * 0.15, minDimension * 0.4)
    const padX = Math.max(RIPPLE_EDGE_PADDING, rect.width * 0.08)
    const padY = Math.max(RIPPLE_EDGE_PADDING, rect.height * 0.08)
    const edgeBandX = rect.width * 0.18
    const bandWidthX = Math.max(edgeBandX, rect.width * 0.08)
    const edgeBandY = rect.height * 0.18
    const bandWidthY = Math.max(edgeBandY, rect.height * 0.08)
    const leftBandEnd = Math.min(rect.width - padX, padX + bandWidthX)
    const rightBandStart = Math.max(padX, rect.width - padX - bandWidthX)
    const topBandEnd = Math.min(rect.height - padY, padY + bandWidthY)
    const bottomBandStart = Math.max(padY, rect.height - padY - bandWidthY)

    const pickTopRight = Math.random() < 0.5
    const originX = pickTopRight
      ? randomBetween(rightBandStart, rect.width - padX)
      : randomBetween(padX, leftBandEnd)
    const originY = pickTopRight
      ? randomBetween(padY, topBandEnd)
      : randomBetween(bottomBandStart, rect.height - padY)
    const rippleScale = randomBetween(RIPPLE_MIN_SCALE, RIPPLE_MAX_SCALE)
    const rippleOpacity = randomBetween(0.25, 0.55)
    const letterPositions: LetterPosition[] =
      letterTargets.length > 0
        ? letterTargets
            .map((el) => {
              const bounds = el.getBoundingClientRect()
              if (bounds.width === 0 || bounds.height === 0) {
                return null
              }
              return {
                el,
                x: bounds.left + bounds.width / 2 - rect.left,
                y: bounds.top + bounds.height / 2 - rect.top,
              }
            })
            .filter((entry): entry is LetterPosition => Boolean(entry))
        : []
    const originPoint: Point = { x: originX, y: originY }

    for (let i = 0; i < RIPPLE_GROUP_SIZE; i++) {
      const ripple = document.createElement("span")
      ripple.className = "landing-ripple"
      ripple.style.left = `${originX}px`
      ripple.style.top = `${originY}px`
      ripple.style.setProperty("--ripple-size", `${baseSize}px`)
      ripple.style.setProperty("--ripple-scale", rippleScale.toFixed(2))
      ripple.style.setProperty("--ripple-duration", `${RIPPLE_DURATION_MS}ms`)
      ripple.style.setProperty("--ripple-delay", `${i * RIPPLE_STAGGER_MS}ms`)
      ripple.style.setProperty("--ripple-opacity", rippleOpacity.toFixed(2))
      field.append(ripple)
      storeTimeout(() => ripple.remove(), RIPPLE_DURATION_MS + i * RIPPLE_STAGGER_MS + 200)
      if (letterPositions.length > 0) {
        impactLettersFromRipple(
          letterPositions,
          originPoint,
          baseSize,
          rippleScale,
          i * RIPPLE_STAGGER_MS,
        )
      }
    }
    return true
  }

  const launchRippleSequence = () => {
    if (disposed) return
    const emitted = emitRippleGroup()
    const interval = emitted
      ? randomBetween(RIPPLE_GROUP_INTERVAL_MIN, RIPPLE_GROUP_INTERVAL_MAX) + RIPPLE_GROUP_REST_MS
      : RIPPLE_RETRY_DELAY_MS
    storeTimeout(launchRippleSequence, interval)
  }

  storeTimeout(launchRippleSequence, RIPPLE_INITIAL_DELAY_MS)
  landingRippleRegistry.set(container, cleanup)
  registerCleanup(cleanup)
}

const animateOrb = (orb: HTMLElement) => {
  if (orb.dataset.orbAnimated === "true") return
  orb.dataset.orbAnimated = "true"
  const runToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  orb.dataset.orbRun = runToken
  const container =
    orb.closest<HTMLElement>(".sidebar.left") ?? orb.closest<HTMLElement>(".landing-shell")
  if (!container) return
  const isLandingShell = container.classList.contains("landing-shell")
  const isSidebar = container.classList.contains("sidebar")
  const shouldLoop = !isSidebar
  if (isLandingShell) {
    initLandingRipples(container)
  }
  if (isSidebar) {
    container.classList.add(READER_MODE_LOCK_CLASS)
  }
  let readerLockReleased = false
  const releaseReaderLock = () => {
    if (readerLockReleased) return
    if (isSidebar) {
      container.classList.remove(READER_MODE_LOCK_CLASS)
    }
    readerLockReleased = true
  }

  const normalizeHue = (value: number) => {
    if (!Number.isFinite(value)) return DEFAULT_ORB_HUE
    const normalized = value % 360
    return normalized < 0 ? normalized + 360 : normalized
  }

  const parseHue = (value: string) => {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : DEFAULT_ORB_HUE
  }

  const initialHue = (() => {
    const inlineValue = container.style.getPropertyValue("--glow-orb-hue")
    if (inlineValue) return parseHue(inlineValue)
    const computedValue = getComputedStyle(container).getPropertyValue("--glow-orb-hue")
    return parseHue(computedValue)
  })()

  let currentHue = normalizeHue(initialHue)

  const commitHue = (hue: number) => {
    currentHue = normalizeHue(hue)
    const hueString = currentHue.toFixed(2)
    container.style.setProperty("--glow-orb-hue", hueString)
    orb.style.setProperty("--glow-orb-hue", hueString)
  }

  const hueDistance = (a: number, b: number) => {
    const diff = Math.abs(a - b)
    return Math.min(diff, 360 - diff)
  }

  const pickNextHue = () => {
    let nextHue = randomHue()
    if (hueDistance(nextHue, currentHue) < MIN_HUE_VARIATION) {
      nextHue = (nextHue + MIN_HUE_VARIATION * 2) % 360
    }
    return nextHue
  }

  const handlePointReached = (pointIndex: number) => {
    if (pointIndex >= DYNAMIC_HUE_START_POINT) {
      commitHue(pickNextHue())
    }
  }

  commitHue(currentHue)

  const contextRect = container.getBoundingClientRect()
  const targets = Array.from(container.querySelectorAll<HTMLElement>(".glow-letter"))
  const letterEntries = targets
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && rect.height > 0)

  const baselineY =
    letterEntries.length > 0 ? Math.max(...letterEntries.map(({ rect }) => rect.bottom)) : undefined

  const baselinePointFor = (rect: DOMRect): Point => ({
    x: rect.left + rect.width / 2 - contextRect.left - orb.offsetWidth / 2,
    y: (baselineY ?? rect.bottom) + 4 - contextRect.top - orb.offsetHeight / 2,
  })

  const anchorPointFor = (rect: DOMRect): Point => ({
    x: rect.left + rect.width / 2 - contextRect.left - orb.offsetWidth / 2,
    y: rect.top - contextRect.top - orb.offsetHeight / 2 + 16,
  })

  const rightmostLetter =
    letterEntries.length > 0
      ? letterEntries.reduce((prev, curr) => (prev.rect.left > curr.rect.left ? prev : curr))
      : undefined
  const leftmostLetter =
    letterEntries.length > 0
      ? letterEntries.reduce((prev, curr) => (prev.rect.left < curr.rect.left ? prev : curr))
      : undefined
  const iLetterEntries = letterEntries
    .filter(({ el }) => el.textContent?.trim().toLowerCase() === "i")
    .map((entry) => {
      const anchor = entry.el.querySelector<HTMLElement>(".funiki-idot-anchor")
      const anchorRect = anchor?.getBoundingClientRect()
      return { ...entry, anchorRect }
    })
    .filter((entry): entry is typeof entry & { anchorRect: DOMRect } => Boolean(entry.anchorRect))

  const firstIEntry =
    iLetterEntries.length > 0
      ? iLetterEntries.reduce((prev, curr) => (prev.rect.left < curr.rect.left ? prev : curr))
      : undefined
  const lastIEntry =
    iLetterEntries.length > 0
      ? iLetterEntries.reduce((prev, curr) => (prev.rect.left > curr.rect.left ? prev : curr))
      : undefined

  const lastIArcPeak = lastIEntry
    ? {
        x:
          lastIEntry.rect.left + lastIEntry.rect.width / 2 - contextRect.left - orb.offsetWidth / 2,
        y: lastIEntry.rect.top - contextRect.top - orb.offsetHeight * 1.4,
      }
    : null

  const anchorStartPoint = firstIEntry ? anchorPointFor(firstIEntry.rect) : null
  const secondAnchorPoint =
    lastIEntry && lastIEntry.el !== firstIEntry?.el ? anchorPointFor(lastIEntry.rect) : null

  const underlineStartPoint =
    (lastIEntry && baselinePointFor(lastIEntry.rect)) ||
    (rightmostLetter && baselinePointFor(rightmostLetter.rect)) ||
    null
  const underlineEndPoint = leftmostLetter
    ? baselinePointFor(leftmostLetter.rect)
    : underlineStartPoint

  const selectStartPoint = (): Point | null => {
    const iLetters = Array.from(container.querySelectorAll<HTMLElement>(".page-title__i"))
    const fallback = container.querySelector<HTMLElement>(".funiki-idot-anchor")
    const source =
      iLetters.length > 0 ? iLetters[Math.floor(Math.random() * iLetters.length)] : fallback
    if (!source) {
      return null
    }
    const rect = source.getBoundingClientRect()
    const offsetY = rect.height * 0.2
    return {
      x: rect.left + rect.width / 2 - contextRect.left - orb.offsetWidth / 2,
      y: rect.top + offsetY - contextRect.top - orb.offsetHeight / 2,
    }
  }

  const fallbackStart = selectStartPoint()

  const curvedSegmentOptions: CurvedSegmentOptions | undefined = isLandingShell
    ? {
        curvatureBoost: 1.45,
        horizontalDriftMultiplier: 1.3,
        terminalLiftMultiplier: 1.2,
      }
    : undefined
  const debugPoints: Point[] = []
  const pushPoint = (pt?: Point | null, options?: PushPointOptions): number => {
    if (!pt) return -1
    const last = debugPoints[debugPoints.length - 1]
    if (last) {
      const distance = Math.hypot(last.x - pt.x, last.y - pt.y)
      if (distance < 1) {
        return debugPoints.length - 1
      }
      if (typeof options?.minDistance === "number" && distance < options.minDistance) {
        return -1
      }
    }
    debugPoints.push(pt)
    return debugPoints.length - 1
  }

  const hoverReferencePoint = underlineEndPoint ?? underlineStartPoint ?? null

  const buildHoverSampleBox = (): HoverSampleBox => {
    const containerWidth = contextRect.width
    const containerHeight = contextRect.height
    const horizontalPad = HOVER_BOX_HORIZONTAL_PAD
    const leftEdge =
      (leftmostLetter?.rect.left ?? contextRect.left) - contextRect.left - horizontalPad
    const rightEdge =
      (rightmostLetter?.rect.right ?? contextRect.left + containerWidth) -
      contextRect.left +
      horizontalPad
    const minX = Math.max(0, leftEdge)
    const maxTargetX = Math.max(minX + 1, Math.min(containerWidth, rightEdge) - orb.offsetWidth)
    const letterTopValues = letterEntries.map(({ rect }) => rect.top)
    const highestLetterTop =
      letterTopValues.length > 0 ? Math.min(...letterTopValues) : contextRect.top + 60
    const topLimitBase = highestLetterTop - contextRect.top - 30 - HOVER_BOX_EXTRA_TOP
    const topLimit = Number.isFinite(topLimitBase) ? topLimitBase : contextRect.height * 0.25
    const bottomReference = hoverReferencePoint ?? underlineStartPoint ?? { y: 60 }
    const bottomLimitBase = (bottomReference?.y ?? 60) + HOVER_BOX_EXTRA_BOTTOM
    let bottomLimit = Number.isFinite(bottomLimitBase) ? bottomLimitBase : topLimit + 120
    if (bottomLimit - topLimit < 40) {
      bottomLimit = topLimit + 40
    }
    let left = minX - orb.offsetWidth / 2
    let right = maxTargetX - orb.offsetWidth / 2
    const maxLeft = Math.max(0, containerWidth - orb.offsetWidth)
    left = Math.min(Math.max(left, 0), maxLeft)
    right = Math.min(Math.max(right, left + 1), maxLeft)
    if (right - left < Math.max(80, orb.offsetWidth)) {
      right = Math.min(left + Math.max(80, orb.offsetWidth), maxLeft)
    }
    let top = topLimit - orb.offsetHeight / 2
    let bottom = bottomLimit - orb.offsetHeight / 2
    const maxTop = Math.max(0, containerHeight - orb.offsetHeight)
    top = Math.min(Math.max(top, 0), maxTop)
    bottom = Math.min(Math.max(bottom, top + 1), maxTop)
    if (bottom - top < Math.max(80, orb.offsetHeight * 1.5)) {
      bottom = Math.min(top + Math.max(80, orb.offsetHeight * 1.5), maxTop)
    }
    return {
      left,
      top,
      right,
      bottom,
    }
  }

  const hoverSampleBox = buildHoverSampleBox()

  const randomHoverPoint = (): Point => {
    const randomWithin = (min: number, max: number) => randomBetween(min, Math.max(min + 1, max))
    return {
      x: randomWithin(hoverSampleBox.left, hoverSampleBox.right),
      y: randomWithin(hoverSampleBox.top, hoverSampleBox.bottom),
    }
  }

  const randomOffscreenPoint = (): Point => {
    const width = contextRect.width
    const height = contextRect.height
    const marginX = Math.max(60, orb.offsetWidth * 2)
    const marginY = Math.max(60, orb.offsetHeight * 2)
    const allowedSides = ["top", "right", "left"] as const
    const side = allowedSides[Math.floor(Math.random() * allowedSides.length)]
    const randomX = () => randomBetween(-marginX, width + marginX)
    const randomY = () => randomBetween(-marginY, height + marginY)
    switch (side) {
      case "top":
        return {
          x: randomX() - orb.offsetWidth / 2,
          y: -marginY - orb.offsetHeight,
        }
      case "right":
        return {
          x: width + marginX,
          y: randomY() - orb.offsetHeight / 2,
        }
      default: // left
        return {
          x: -marginX - orb.offsetWidth,
          y: randomY() - orb.offsetHeight / 2,
        }
    }
  }

  const appendOffscreenPoint = () => {
    if (debugPoints.length === 0) {
      pushPoint(randomOffscreenPoint())
      return
    }
    let attempts = 0
    while (attempts < 25) {
      const index = pushPoint(randomOffscreenPoint(), { minDistance: MIN_DEBUG_POINT_DISTANCE })
      if (index !== -1) {
        return
      }
      attempts += 1
    }
    pushPoint(randomOffscreenPoint())
  }

  const createArcOverLastISegment = (
    start: Point,
    end: Point,
    duration: number,
    options?: CurvedSegmentOptions,
  ): PathSegment => {
    if (!lastIArcPeak) {
      return createCurvedSegment(start, end, "up", duration, options)
    }
    const rawPeakY = Math.min(start.y, end.y, lastIArcPeak.y) - 12
    const peakY = Number.isFinite(rawPeakY) ? rawPeakY : lastIArcPeak.y
    const control1: Point = {
      x: start.x + (lastIArcPeak.x - start.x) * 0.6,
      y: peakY - 6,
    }
    const control2: Point = {
      x: end.x + (lastIArcPeak.x - end.x) * 0.35,
      y: peakY,
    }
    return {
      start,
      control1,
      control2,
      end,
      duration,
    }
  }

  const buildLandingTrajectory = () => {
    pushPoint(randomHoverPoint(), { minDistance: MIN_DEBUG_POINT_DISTANCE })
    let guard = 0
    while (debugPoints.length < MAX_TRAJECTORY_POINTS - 1 && guard < 200) {
      const before = debugPoints.length
      pushPoint(randomHoverPoint(), { minDistance: MIN_DEBUG_POINT_DISTANCE })
      guard = debugPoints.length === before ? guard + 1 : 0
    }
  }

  const buildLetterTrajectory = () => {
    pushPoint(anchorStartPoint ?? fallbackStart)
    const referencePoint = hoverReferencePoint ?? debugPoints[debugPoints.length - 1]
    const shiftedUnderlineStart =
      underlineStartPoint && referencePoint
        ? { ...underlineStartPoint, x: underlineStartPoint.x + 12 }
        : underlineStartPoint
    pushPoint(shiftedUnderlineStart)
    pushPoint(underlineEndPoint)

    if (referencePoint) {
      pushPoint({ x: referencePoint.x - 30, y: referencePoint.y - 25 })
    }

    const reservedTailPoints = secondAnchorPoint ? 2 : 1
    let guard = 0
    while (debugPoints.length < MAX_TRAJECTORY_POINTS - reservedTailPoints && guard < 200) {
      const before = debugPoints.length
      pushPoint(randomHoverPoint(), { minDistance: MIN_DEBUG_POINT_DISTANCE })
      guard = debugPoints.length === before ? guard + 1 : 0
    }

    if (secondAnchorPoint) {
      pushPoint(secondAnchorPoint)
    }
  }

  if (isLandingShell) {
    buildLandingTrajectory()
  } else {
    buildLetterTrajectory()
  }

  if (debugPoints.length === 0) {
    pushPoint(fallbackStart)
  }

  if (debugPoints.length > 0) {
    appendOffscreenPoint()
  }

  if (debugPoints.length < 2) {
    releaseReaderLock()
    return
  }

  debugPoints.splice(MAX_TRAJECTORY_POINTS)

  const initialPosition = debugPoints[0]
  const segments: PathSegment[] = []
  segments.push(createLinearSegment(initialPosition, initialPosition, HOLD_SEGMENT_DURATION))
  let movementIndex = 0
  for (let i = 0; i < debugPoints.length - 1; i++) {
    const from = debugPoints[i]
    const to = debugPoints[i + 1]
    const isFinalSegment = i === debugPoints.length - 2
    let duration: number
    if (movementIndex === 0) {
      duration = FIRST_MOVE_DURATION
    } else if (movementIndex === 1) {
      duration = UNDERLINE_SEGMENT_DURATION
    } else {
      duration = randomBetween(RANDOM_SEGMENT_MIN_DURATION, RANDOM_SEGMENT_MAX_DURATION)
    }
    let segment: PathSegment
    if (movementIndex === 0) {
      segment = createArcOverLastISegment(from, to, duration, curvedSegmentOptions)
    } else {
      const useCurvedSegment =
        isFinalSegment || (isLandingShell ? movementIndex >= 1 : movementIndex >= 3)
      const bias: "down" | "up" = to.y >= from.y ? "down" : "up"
      segment = useCurvedSegment
        ? createCurvedSegment(from, to, bias, duration, curvedSegmentOptions)
        : createLinearSegment(from, to, duration)
    }
    segments.push(segment)
    movementIndex += 1
  }

  const debugEnabled = ENABLE_ORB_DEBUG || container.dataset.orbDebug === "true"
  const debugArtifacts = renderDebugPoints(
    container,
    orb,
    debugPoints,
    segments,
    debugEnabled,
    contextRect,
  )
  const setActiveDebugMarker = (index: number) => {
    if (!debugArtifacts) return
    debugArtifacts.markers.forEach((marker, idx) => {
      marker.classList.toggle("is-active", idx === index)
    })
  }

  let segmentIndex = 0
  let segmentStart: number | null = null

  const placeOrbAtStart = () => {
    orb.style.left = `${initialPosition.x}px`
    orb.style.top = `${initialPosition.y}px`
  }
  setActiveDebugMarker(0)

  const step = (timestamp: number) => {
    if (orb.dataset.orbRun !== runToken) {
      return
    }
    const segment = segments[segmentIndex]
    if (!segment) {
      if (shouldLoop) {
        orb.style.opacity = "0"
        setActiveDebugMarker(-1)
        segmentIndex = 0
        segmentStart = null
        setTimeout(() => {
          placeOrbAtStart()
          orb.style.opacity = "0.85"
          setActiveDebugMarker(0)
          requestAnimationFrame(step)
        }, LOOP_DELAY_MS)
      } else {
        orb.style.opacity = "0"
        targets.forEach((el) => el.classList.remove("orb-illuminated"))
        setActiveDebugMarker(-1)
        releaseReaderLock()
      }
      return
    }

    if (segmentStart === null) {
      segmentStart = timestamp
    }

    const elapsed = timestamp - segmentStart
    const t = Math.min(elapsed / segment.duration, 1)
    const pos = evaluateCubic(segment, t)
    orb.style.left = `${pos.x}px`
    orb.style.top = `${pos.y}px`
    const markerIndex =
      debugArtifacts && debugArtifacts.markers.length > 0
        ? Math.min(segmentIndex, debugArtifacts.markers.length - 1)
        : -1
    setActiveDebugMarker(markerIndex)

    const orbRect = orb.getBoundingClientRect()
    highlightTargets(targets, orbRect)

    if (t >= 1) {
      if (segmentIndex >= 1) {
        const reachedPointIndex = Math.min(segmentIndex, debugPoints.length - 1)
        handlePointReached(reachedPointIndex)
      }
      segmentIndex += 1
      segmentStart = null
    }
    requestAnimationFrame(step)
  }

  placeOrbAtStart()
  orb.style.opacity = "0"
  setTimeout(() => {
    orb.style.opacity = "0.85"
    requestAnimationFrame(step)
  }, FADE_IN_HOLD_MS)
}

document.addEventListener("nav", () => {
  const slug = document.body.dataset.slug ?? ""
  document.querySelectorAll<HTMLElement>(".glow-orb").forEach((orb) => {
    const isLanding = Boolean(orb.closest(".landing-shell"))
    const shouldRun =
      (isLanding && slug === "index") || (!isLanding && (slug === "" || slug === "index"))
    if (!shouldRun) return
    animateOrb(orb)
  })
})

if (typeof window !== "undefined") {
  let resizeDebounce: number | undefined
  const resetOrbsForResize = () => {
    document
      .querySelectorAll<HTMLElement>(".orb-debug-overlay[data-orb-runtime]")
      .forEach((node) => node.remove())
    document.querySelectorAll<HTMLElement>(".glow-orb").forEach((orb) => {
      orb.dataset.orbAnimated = ""
      orb.dataset.orbRun = ""
      orb.style.opacity = "0"
    })
    document.dispatchEvent(new CustomEvent("nav", { detail: {} }))
  }
  window.addEventListener("resize", () => {
    if (resizeDebounce !== undefined) {
      window.clearTimeout(resizeDebounce)
    }
    resizeDebounce = window.setTimeout(resetOrbsForResize, 150)
  })
}
