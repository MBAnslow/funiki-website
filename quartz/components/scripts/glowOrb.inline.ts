const FADE_IN_HOLD_MS = 350
const MAX_TRAJECTORY_POINTS = 8
const HOLD_SEGMENT_DURATION = 1000
const FIRST_MOVE_DURATION = 1500
const UNDERLINE_SEGMENT_DURATION = 1500
const RANDOM_SEGMENT_MIN_DURATION = 800
const RANDOM_SEGMENT_MAX_DURATION = 1200

type Point = { x: number; y: number }
type PathSegment = {
  start: Point
  control1: Point
  control2: Point
  end: Point
  duration: number
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)
const DEFAULT_ORB_HUE = 48
const DYNAMIC_HUE_START_POINT = 2
const MIN_HUE_VARIATION = 15
const READER_MODE_LOCK_CLASS = "orb-reader-lock"
const ENABLE_ORB_DEBUG = false
const randomHue = () => Math.floor(randomBetween(0, 360))

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
): PathSegment => {
  const offsetY = bias === "down" ? randomBetween(12, 28) : randomBetween(-26, -10)
  const control1: Point = {
    x: start.x + randomBetween(-40, 40),
    y: start.y + offsetY,
  }
  const control2: Point = {
    x: end.x + randomBetween(-40, 40),
    y: end.y + (bias === "down" ? randomBetween(-18, 6) : randomBetween(12, 32)),
  }
  return {
    start,
    control1,
    control2,
    end,
    duration,
  }
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
    } else {
      el.classList.remove("orb-illuminated")
    }
  }
}

const renderDebugPoints = (sidebar: HTMLElement, orb: HTMLElement, points: Point[]) => {
  const existing = sidebar.querySelector(".orb-debug-overlay")
  existing?.remove()
  if (!ENABLE_ORB_DEBUG) {
    return
  }
  const overlay = document.createElement("div")
  overlay.className = "orb-debug-overlay"
  points.forEach((point, idx) => {
    const marker = document.createElement("div")
    marker.className = "orb-debug-point"
    marker.textContent = String(idx + 1)
    marker.style.left = `${point.x + orb.offsetWidth / 2}px`
    marker.style.top = `${point.y + orb.offsetHeight / 2}px`
    overlay.append(marker)
  })
  sidebar.append(overlay)
}

const animateOrb = (orb: HTMLElement) => {
  if (orb.dataset.orbAnimated === "true") return
  orb.dataset.orbAnimated = "true"
  const sidebar = orb.closest<HTMLElement>(".sidebar.left")
  if (!sidebar) return

  sidebar.classList.add(READER_MODE_LOCK_CLASS)
  let readerLockReleased = false
  const releaseReaderLock = () => {
    if (readerLockReleased) return
    sidebar.classList.remove(READER_MODE_LOCK_CLASS)
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
    const inlineValue = sidebar.style.getPropertyValue("--glow-orb-hue")
    if (inlineValue) return parseHue(inlineValue)
    const computedValue = getComputedStyle(sidebar).getPropertyValue("--glow-orb-hue")
    return parseHue(computedValue)
  })()

  let currentHue = normalizeHue(initialHue)

  const commitHue = (hue: number) => {
    currentHue = normalizeHue(hue)
    sidebar.style.setProperty("--glow-orb-hue", currentHue.toFixed(2))
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

  const sidebarRect = sidebar.getBoundingClientRect()
  const targets = Array.from(sidebar.querySelectorAll<HTMLElement>(".glow-letter"))
  const letterEntries = targets
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && rect.height > 0)

  const baselineY =
    letterEntries.length > 0 ? Math.max(...letterEntries.map(({ rect }) => rect.bottom)) : undefined

  const baselinePointFor = (rect: DOMRect): Point => ({
    x: rect.left + rect.width / 2 - sidebarRect.left - orb.offsetWidth / 2,
    y: (baselineY ?? rect.bottom) + 4 - sidebarRect.top - orb.offsetHeight / 2,
  })

  const anchorPointFor = (rect: DOMRect): Point => ({
    x: rect.left + rect.width / 2 - sidebarRect.left - orb.offsetWidth / 2,
    y: rect.top - sidebarRect.top - orb.offsetHeight / 2 + 16,
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
    const iLetters = Array.from(sidebar.querySelectorAll<HTMLElement>(".page-title__i"))
    const fallback = sidebar.querySelector<HTMLElement>(".funiki-idot-anchor")
    const source =
      iLetters.length > 0 ? iLetters[Math.floor(Math.random() * iLetters.length)] : fallback
    if (!source) {
      return null
    }
    const rect = source.getBoundingClientRect()
    const offsetY = rect.height * 0.2
    return {
      x: rect.left + rect.width / 2 - sidebarRect.left - orb.offsetWidth / 2,
      y: rect.top + offsetY - sidebarRect.top - orb.offsetHeight / 2,
    }
  }

  const fallbackStart = selectStartPoint()

  const debugPoints: Point[] = []
  const pushPoint = (pt?: Point | null): number => {
    if (!pt) return -1
    const last = debugPoints[debugPoints.length - 1]
    if (last && Math.hypot(last.x - pt.x, last.y - pt.y) < 1) {
      return debugPoints.length - 1
    }
    debugPoints.push(pt)
    return debugPoints.length - 1
  }

  const anchorIndex = pushPoint(anchorStartPoint ?? fallbackStart)
  const referencePoint =
    underlineEndPoint ?? underlineStartPoint ?? debugPoints[debugPoints.length - 1]
  const shiftedUnderlineStart =
    underlineStartPoint && referencePoint
      ? { ...underlineStartPoint, x: underlineStartPoint.x + 12 }
      : underlineStartPoint
  const underlineStartIndex = pushPoint(shiftedUnderlineStart)
  const underlineEndIndex = pushPoint(underlineEndPoint)

  if (referencePoint) {
    pushPoint({ x: referencePoint.x - 30, y: referencePoint.y - 25 })
  }

  const randomHoverPoint = (): Point => {
    const maxX = sidebarRect.width
    const minX = Math.max(
      0,
      (leftmostLetter?.rect.left ?? sidebarRect.left) - sidebarRect.left - 20,
    )
    const maxClampX =
      Math.min(
        maxX,
        (rightmostLetter?.rect.right ?? sidebarRect.left + maxX) - sidebarRect.left + 20,
      ) - orb.offsetWidth
    const centerX = randomBetween(minX, Math.max(minX + 1, maxClampX))
    const topLimit =
      (Math.min(...letterEntries.map(({ rect }) => rect.top)) ?? sidebarRect.top) -
      sidebarRect.top -
      30
    const bottomLimit = (underlineStartPoint ?? referencePoint ?? { y: 60 }).y - 10
    const centerY = randomBetween(topLimit, bottomLimit)
    return {
      x: centerX - orb.offsetWidth / 2,
      y: centerY - orb.offsetHeight / 2,
    }
  }

  const reservedTailPoints = secondAnchorPoint ? 2 : 1
  let guard = 0
  while (debugPoints.length < MAX_TRAJECTORY_POINTS - reservedTailPoints && guard < 200) {
    const before = debugPoints.length
    pushPoint(randomHoverPoint())
    guard = debugPoints.length === before ? guard + 1 : 0
  }

  if (secondAnchorPoint) {
    pushPoint(secondAnchorPoint)
  }

  const lastPoint = debugPoints[debugPoints.length - 1]
  if (lastPoint) {
    pushPoint({
      x: lastPoint.x + randomBetween(40, 80),
      y: -orb.offsetHeight * 3,
    })
  }

  if (debugPoints.length === 0) {
    pushPoint(fallbackStart)
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
    let duration: number
    if (movementIndex === 0) {
      duration = FIRST_MOVE_DURATION
    } else if (movementIndex === 1) {
      duration = UNDERLINE_SEGMENT_DURATION
    } else {
      duration = randomBetween(RANDOM_SEGMENT_MIN_DURATION, RANDOM_SEGMENT_MAX_DURATION)
    }
    const isUnderlineSegment =
      movementIndex !== 0 &&
      ((i === anchorIndex && i + 1 === underlineStartIndex && anchorIndex !== -1) ||
        (i === underlineStartIndex && i + 1 === underlineEndIndex && underlineStartIndex !== -1))
    if (movementIndex === 0) {
      const bias = to.y >= from.y ? "down" : "up"
      segments.push(createCurvedSegment(from, to, bias, duration))
    } else if (isUnderlineSegment) {
      segments.push(createLinearSegment(from, to, duration))
    } else {
      const bias = to.y >= from.y ? "down" : "up"
      segments.push(createCurvedSegment(from, to, bias, duration))
    }
    movementIndex += 1
  }

  renderDebugPoints(sidebar, orb, debugPoints)

  let segmentIndex = 0
  let segmentStart: number | null = null

  const placeOrbAtStart = () => {
    orb.style.left = `${initialPosition.x}px`
    orb.style.top = `${initialPosition.y}px`
  }

  const step = (timestamp: number) => {
    const segment = segments[segmentIndex]
    if (!segment) {
      orb.style.opacity = "0"
      targets.forEach((el) => el.classList.remove("orb-illuminated"))
      releaseReaderLock()
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
  const orb = document.querySelector<HTMLElement>(".glow-orb")
  if (!orb) return
  const slug = document.body.dataset.slug
  if (slug !== "" && slug !== "index") return
  animateOrb(orb)
})
