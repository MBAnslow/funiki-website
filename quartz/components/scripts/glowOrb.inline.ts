const FADE_IN_HOLD_MS = 850
const LOOP_DELAY_MS = 1200
const LOOP_RESTART_DELAY_MS = 3800
const MAX_TRAJECTORY_POINTS = 6
const MIN_DEBUG_POINT_DISTANCE = 64
const MIN_AXIS_POINT_DISTANCE = 20
const HOVER_BOX_HORIZONTAL_PAD = 80
const HOVER_BOX_EXTRA_TOP = 0
const HOVER_BOX_EXTRA_BOTTOM = 30
const HOLD_SEGMENT_DURATION = 1000
const FIRST_MOVE_DURATION = 1500
const UNDERLINE_SEGMENT_DURATION = 1500
const RANDOM_SEGMENT_MIN_DURATION = 800
const RANDOM_SEGMENT_MAX_DURATION = 1200
const RIPPLE_GROUP_INTERVAL_MIN = 8200
const RIPPLE_GROUP_INTERVAL_MAX = 12200
const RIPPLE_GROUP_REST_MS = 2400
const RIPPLE_INITIAL_DELAY_MS = 2000
const RIPPLE_RETRY_DELAY_MS = 800
const RIPPLE_GROUP_SIZE = 1
const RIPPLE_STAGGER_MS = 0
const RIPPLE_DURATION_MS = 1800
const RIPPLE_EDGE_PADDING = 160
const RIPPLE_MIN_SCALE = 1.2
const RIPPLE_MAX_SCALE = 1.8
const RIPPLE_INITIAL_SCALE = 0.25
const RIPPLE_LETTER_EFFECT_MS = 900

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
const ENABLE_ORB_RIPPLES = true
const ENABLE_ORB_COLLISIONS = true
const ENABLE_ORB_MOVEMENT = true
const SVG_NS = "http://www.w3.org/2000/svg"
const randomHue = () => Math.floor(randomBetween(0, 360))

const registerOrbCleanup = (fn: () => void) => {
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

const directionFromSegmentEnd = (segment?: PathSegment | null): Point | null => {
  if (!segment) return null
  const dx = segment.end.x - segment.control2.x
  const dy = segment.end.y - segment.control2.y
  const len = Math.hypot(dx, dy)
  if (!isFinite(len) || len < 1e-3) return null
  return { x: dx / len, y: dy / len }
}

const createCurvedSegmentAligned = (
  start: Point,
  end: Point,
  bias: "down" | "up",
  duration: number,
  options: CurvedSegmentOptions = {},
  prevSegment?: PathSegment | null,
): PathSegment => {
  const prevDir = directionFromSegmentEnd(prevSegment)
  if (!prevDir) {
    return createCurvedSegment(start, end, bias, duration, options)
  }

  const { curvatureBoost = 1, horizontalDriftMultiplier = 1 } = options
  const span = Math.hypot(end.x - start.x, end.y - start.y) || 1
  const base = span / 3
  const d1 = Math.max(28, base * horizontalDriftMultiplier * 0.9)
  const d2 = Math.max(28, base * horizontalDriftMultiplier * 0.9)

  // Bend slightly using the perpendicular to preserve "up/down" bias while following the incoming tangent.
  const perp = { x: -prevDir.y, y: prevDir.x }
  const perpLen = Math.hypot(perp.x, perp.y)
  if (perpLen > 1e-5) {
    perp.x /= perpLen
    perp.y /= perpLen
  }
  const bendScale = Math.max(0.18, Math.min(0.32, curvatureBoost * 0.22))
  const bend = bendScale * span * (bias === "down" ? 1 : -1)
  const bendX = perp.x * bend
  const bendY = perp.y * bend

  return {
    start,
    control1: {
      x: start.x + prevDir.x * d1 + bendX * 0.35,
      y: start.y + prevDir.y * d1 + bendY * 0.35,
    },
    control2: {
      x: end.x - prevDir.x * d2 + bendX,
      y: end.y - prevDir.y * d2 + bendY,
    },
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

type CachedRect = { rect: DOMRect; version: number }
const letterRectCache = new WeakMap<Element, CachedRect>()
let letterRectVersion = 0
const cacheLetterRect = (el: Element, rect: DOMRect) => {
  letterRectCache.set(el, { rect, version: letterRectVersion })
}
const getLetterRect = (el: Element): DOMRect => {
  const cached = letterRectCache.get(el)
  if (cached && cached.version === letterRectVersion) {
    return cached.rect
  }
  const rect = el.getBoundingClientRect()
  cacheLetterRect(el, rect)
  return rect
}
const invalidateLetterRectCache = () => {
  letterRectVersion += 1
}

const highlightTargets = (targets: HTMLElement[], orbRect: DOMRect) => {
  for (const el of targets) {
    const rect = getLetterRect(el)
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
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  if (landingRippleRegistry.has(container)) return
  const { field, isSynthetic } = ensureRippleField(container)
  const timeouts = new Set<number>()
  let disposed = false

  const storeTimeout = (callback: () => void, delay: number) => {
    const handle = window.setTimeout(() => {
      timeouts.delete(handle)
      callback()
    }, delay)
    timeouts.add(handle)
    return handle
  }

  const cleanup = () => {
    if (disposed) return
    disposed = true
    timeouts.forEach((handle) => window.clearTimeout(handle))
    timeouts.clear()
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
    const padX = Math.max(RIPPLE_EDGE_PADDING, rect.width * 0.02)
    const padY = Math.max(RIPPLE_EDGE_PADDING, rect.height * 0.02)
    const edgeOffset = Math.max(baseSize * 0.25, Math.min(padX, padY) * 0.2)
    // pick an edge, but keep most of the ripple on-screen near that edge
    const edge = ["top", "right", "bottom", "left"][Math.floor(Math.random() * 4)]
    let originX: number
    let originY: number
    switch (edge) {
      case "top":
        originX = randomBetween(padX, rect.width - padX)
        originY = edgeOffset
        break
      case "bottom":
        originX = randomBetween(padX, rect.width - padX)
        originY = rect.height - edgeOffset
        break
      case "right":
        originX = rect.width - edgeOffset
        originY = randomBetween(padY, rect.height - padY)
        break
      default: // left
        originX = edgeOffset
        originY = randomBetween(padY, rect.height - padY)
        break
    }
    const rippleScale = randomBetween(RIPPLE_MIN_SCALE, RIPPLE_MAX_SCALE)
    const rippleOpacity = randomBetween(0.15, 0.45)
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

  landingRippleRegistry.set(container, cleanup)
  registerOrbCleanup(cleanup)
  launchRippleSequence()
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
  const rippleField = isLandingShell ? ensureRippleField(container).field : null
  if (isLandingShell && ENABLE_ORB_RIPPLES) {
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
  const COLLISION_SKIP_INTERVAL = 2
  let collisionFrameCounter = 0

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
  const targets = container.classList.contains("landing-shell")
    ? Array.from(container.querySelectorAll<HTMLElement>(".landing-title .glow-letter"))
    : []
  const letterEntries = targets
    .map((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) {
        return null
      }
      cacheLetterRect(el, rect)
      return { el, rect }
    })
    .filter((entry): entry is { el: HTMLElement; rect: DOMRect } => entry !== null)

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
    // Reject if this point is effectively identical to the last accepted point
    // or violates spacing against any previous point. We enforce both Euclidean
    // distance and per-axis separation to avoid overlapping or overly aligned
    // debug markers (keeps the path visibly distinct and prevents sharp kinks).
    for (const existing of debugPoints) {
      const distance = Math.hypot(existing.x - pt.x, existing.y - pt.y)
      const deltaX = Math.abs(existing.x - pt.x)
      const deltaY = Math.abs(existing.y - pt.y)
      if (distance < 1) {
        return debugPoints.length - 1
      }
      if (typeof options?.minDistance === "number" && distance < options.minDistance) {
        return -1
      }
      if (deltaX < MIN_AXIS_POINT_DISTANCE || deltaY < MIN_AXIS_POINT_DISTANCE) {
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

    duration = randomBetween(RANDOM_SEGMENT_MIN_DURATION, RANDOM_SEGMENT_MAX_DURATION)

    let segment: PathSegment
    const bias: "down" | "up" = to.y >= from.y ? "down" : "up"
    const commonOptions = {
      curvatureBoost: 1.4,
      horizontalDriftMultiplier: 1.3,
      terminalLiftMultiplier: 1.1,
      ...curvedSegmentOptions,
    }
    if (movementIndex === 0) {
      segment = createArcOverLastISegment(from, to, duration, curvedSegmentOptions)
    } else if (isFinalSegment) {
      duration = Math.max(duration * 2.4, 2000)
      segment = createCurvedSegmentAligned(
        from,
        to,
        bias,
        duration,
        {
          curvatureBoost: 3.2,
          horizontalDriftMultiplier: 2.6,
          terminalLiftMultiplier: 2.0,
        },
        segments[segments.length - 1],
      )
    } else {
      segment = createCurvedSegmentAligned(
        from,
        to,
        bias,
        duration,
        commonOptions,
        segments[segments.length - 1],
      )
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
  const orbHalfWidth = orb.offsetWidth / 2
  const orbHalfHeight = orb.offsetHeight / 2
  const orbWidth = orbHalfWidth * 2
  const orbHeight = orbHalfHeight * 2

  const emitRippleAtPoint = (origin: Point, rect: DOMRect) => {
    if (!rippleField) return
    if (rect.width === 0 || rect.height === 0) return
    const baseSize = Math.min(rect.width, rect.height) * randomBetween(0.1, 0.8)
    const originX = origin.x + orbHalfWidth
    const originY = origin.y + orbHalfHeight
    const count = 3
    const sizeStep = baseSize * 0.2
    const emitStagger = 800
    for (let i = 0; i < count; i++) {
      const delay = i * emitStagger
      window.setTimeout(() => {
        const ripple = document.createElement("span")
        ripple.className = "landing-ripple"
        ripple.style.left = `${originX}px`
        ripple.style.top = `${originY}px`
        const size = sizeStep + i
        ripple.style.setProperty("--ripple-size", `${size}px`)
        const rippleScale = 1.6
        ripple.style.setProperty("--ripple-scale", rippleScale.toFixed(2))
        ripple.style.setProperty("--ripple-duration", `${RIPPLE_DURATION_MS}ms`)
        ripple.style.setProperty("--ripple-delay", "0ms")
        ripple.style.setProperty("--ripple-opacity", (1.0).toFixed(2))
        rippleField.append(ripple)
        window.setTimeout(() => ripple.remove(), RIPPLE_DURATION_MS + 400)
      }, delay)
    }
  }

  const scheduleRippleAtPoint = (origin: Point) => {
    if (!rippleField) return
    if (!ENABLE_ORB_RIPPLES) return
    const originSnapshot = { x: origin.x, y: origin.y }
    window.requestAnimationFrame(() => {
      if (orb.dataset.orbRun !== runToken || !rippleField.isConnected) {
        return
      }
      const rect = rippleField.getBoundingClientRect()
      emitRippleAtPoint(originSnapshot, rect)
    })
  }

  const placeOrbAtStart = () => {
    orb.style.transform = `translate3d(${initialPosition.x}px, ${initialPosition.y}px, 0)`
  }
  if (!ENABLE_ORB_MOVEMENT) {
    placeOrbAtStart()
    orb.style.opacity = "0.85"
    return
  }
  setActiveDebugMarker(0)

  const scheduleCollisionCheck = (() => {
    let pending = false
    let lastRect: DOMRect | null = null
    const run = () => {
      pending = false
      if (!lastRect) return
      highlightTargets(targets, lastRect)
      lastRect = null
    }
    return (rect: DOMRect) => {
      lastRect = rect
      if (pending) return
      pending = true
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        ;(
          window as typeof window & {
            requestIdleCallback: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => void
          }
        ).requestIdleCallback(run, { timeout: 50 })
        return
      }
      setTimeout(run, 0)
    }
  })()

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
        collisionFrameCounter = 0
        setTimeout(() => {
          placeOrbAtStart()
          orb.style.opacity = "0.85"
          setActiveDebugMarker(0)
          requestAnimationFrame(step)
        }, LOOP_DELAY_MS + LOOP_RESTART_DELAY_MS)
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
    orb.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
    const markerIndex =
      debugArtifacts && debugArtifacts.markers.length > 0
        ? Math.min(segmentIndex, debugArtifacts.markers.length - 1)
        : -1
    setActiveDebugMarker(markerIndex)

    const shouldCheckCollision =
      ENABLE_ORB_COLLISIONS && (!shouldLoop || collisionFrameCounter === 0)
    if (shouldCheckCollision) {
      const left = contextRect.left + pos.x
      const top = contextRect.top + pos.y
      const orbRect = {
        left,
        top,
        right: left + orbWidth,
        bottom: top + orbHeight,
        width: orbWidth,
        height: orbHeight,
        x: left,
        y: top,
        toJSON: () => ({}),
      } as DOMRect
      scheduleCollisionCheck(orbRect)
    }
    if (shouldLoop) {
      collisionFrameCounter = (collisionFrameCounter + 1) % COLLISION_SKIP_INTERVAL
    }

    if (t >= 1) {
      if (segmentIndex >= 1) {
        const reachedPointIndex = Math.min(segmentIndex, debugPoints.length - 1)
        handlePointReached(reachedPointIndex)
        if (isLandingShell) {
          const isLastPoint = reachedPointIndex >= debugPoints.length - 1
          const shouldEmit = !isLastPoint && Math.random() < 0.35
          if (shouldEmit) {
            scheduleRippleAtPoint(pos)
          }
        }
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

const scheduleOrbAnimation = (orb: HTMLElement) => {
  const start = () => animateOrb(orb)
  if (typeof window === "undefined") {
    start()
    return
  }

  if ("requestIdleCallback" in window) {
    ;(window as typeof window & { requestIdleCallback: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => void }).requestIdleCallback(
      start,
      { timeout: 500 },
    )
    return
  }

  requestAnimationFrame(start)
}

const runOrbAnimations = () => {
  invalidateLetterRectCache()
  const slug = document.body.dataset.slug?.toLowerCase() ?? ""
  const isLandingPage = document.body.dataset.landing === "true"
  document.querySelectorAll<HTMLElement>(".glow-orb").forEach((orb) => {
    const isLanding = Boolean(orb.closest(".landing-shell"))
    const shouldRun =
      (isLanding && isLandingPage) || (!isLanding && (slug === "" || isLandingPage))
    if (!shouldRun) return
    scheduleOrbAnimation(orb)
  })
}

document.addEventListener("nav", runOrbAnimations)
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runOrbAnimations, { once: true })
  } else {
    runOrbAnimations()
  }
}

if (typeof window !== "undefined") {
  let resizeDebounce: number | undefined
  let pendingNavRestart = false
  let lastViewportWidth = window.innerWidth
  let lastViewportHeight = window.innerHeight

  const queueOrbRestart = () => {
    if (pendingNavRestart) return
    pendingNavRestart = true
    window.requestAnimationFrame(() => {
      pendingNavRestart = false
      document.dispatchEvent(new CustomEvent("nav", { detail: {} }))
    })
  }

  const resetOrbsForResize = () => {
    const widthDelta = Math.abs(window.innerWidth - lastViewportWidth)
    const heightDelta = Math.abs(window.innerHeight - lastViewportHeight)
    const significantChange = widthDelta > 4 || heightDelta > 4
    if (!significantChange) {
      return
    }
    lastViewportWidth = window.innerWidth
    lastViewportHeight = window.innerHeight
    invalidateLetterRectCache()
    document
      .querySelectorAll<HTMLElement>(".orb-debug-overlay[data-orb-runtime]")
      .forEach((node) => node.remove())
    document.querySelectorAll<HTMLElement>(".glow-orb").forEach((orb) => {
      orb.dataset.orbAnimated = ""
      orb.dataset.orbRun = ""
      orb.style.opacity = "0"
    })
    queueOrbRestart()
  }
  window.addEventListener("resize", () => {
    if (resizeDebounce !== undefined) {
      window.clearTimeout(resizeDebounce)
    }
    resizeDebounce = window.setTimeout(resetOrbsForResize, 150)
  })
}
