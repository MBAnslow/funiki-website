const FADE_IN_HOLD_MS = 350
const MAX_TRAJECTORY_POINTS = 8
const FIRST_SEGMENT_DURATION = 800
const SECOND_SEGMENT_DURATION = 1500
const RANDOM_SEGMENT_MIN_DURATION = 500
const RANDOM_SEGMENT_MAX_DURATION = 800

type Point = { x: number; y: number }
type PathSegment = {
  start: Point
  control1: Point
  control2: Point
  end: Point
  duration: number
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

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

const renderDebugPoints = (
  sidebar: HTMLElement,
  orb: HTMLElement,
  points: Point[],
) => {
  const existing = sidebar.querySelector(".orb-debug-overlay")
  existing?.remove()
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

  const sidebarRect = sidebar.getBoundingClientRect()
  const targets = Array.from(sidebar.querySelectorAll<HTMLElement>(".glow-letter"))
  const letterEntries = targets
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && rect.height > 0)

  const baselineY =
    letterEntries.length > 0
      ? Math.max(...letterEntries.map(({ rect }) => rect.bottom))
      : undefined

  const baselinePointFor = (rect: DOMRect): Point => ({
    x: rect.left + rect.width / 2 - sidebarRect.left - orb.offsetWidth / 2,
    y:
      (baselineY ?? rect.bottom) +
      4 -
      sidebarRect.top -
      orb.offsetHeight / 2,
  })

  const anchorPointFor = (rect: DOMRect): Point => ({
    x: rect.left + rect.width / 2 - sidebarRect.left - orb.offsetWidth / 2,
    y: rect.top + rect.height / 2 - sidebarRect.top - orb.offsetHeight / 2,
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

  const anchorStartPoint = firstIEntry ? anchorPointFor(firstIEntry.anchorRect) : null

  const underlineStartPoint =
    (lastIEntry && baselinePointFor(lastIEntry.rect)) ||
    (rightmostLetter && baselinePointFor(rightmostLetter.rect)) ||
    null
  const underlineEndPoint = leftmostLetter ? baselinePointFor(leftmostLetter.rect) : underlineStartPoint

  const selectStartPoint = (): Point | null => {
    const iLetters = Array.from(sidebar.querySelectorAll<HTMLElement>(".page-title__i"))
    const fallback = sidebar.querySelector<HTMLElement>(".funiki-idot-anchor")
    const source =
      iLetters.length > 0
        ? iLetters[Math.floor(Math.random() * iLetters.length)]
        : fallback
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
  const underlineStartIndex = pushPoint(underlineStartPoint)
  const underlineEndIndex = pushPoint(underlineEndPoint)

  const referencePoint = underlineEndPoint ?? underlineStartPoint ?? debugPoints[debugPoints.length - 1]
  if (referencePoint) {
    pushPoint({ x: referencePoint.x - 30, y: referencePoint.y - 25 })
  }

  const randomHoverPoint = (): Point => {
    const maxX = sidebarRect.width
    const minX = 0
    const centerX = randomBetween(minX, Math.max(minX + 1, maxX))
    const topLimit = -orb.offsetHeight * 2
    const bottomLimit = (underlineStartPoint ?? referencePoint ?? { y: 60 }).y - 20
    const centerY = randomBetween(topLimit, bottomLimit)
    return {
      x: centerX - orb.offsetWidth / 2,
      y: centerY - orb.offsetHeight / 2,
    }
  }

  let guard = 0
  while (debugPoints.length < MAX_TRAJECTORY_POINTS - 1 && guard < 200) {
    const before = debugPoints.length
    pushPoint(randomHoverPoint())
    guard = debugPoints.length === before ? guard + 1 : 0
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

  if (debugPoints.length < 2) return

  debugPoints.splice(MAX_TRAJECTORY_POINTS)

  const initialPosition = debugPoints[0]
  const segments: PathSegment[] = []
  for (let i = 0; i < debugPoints.length - 1; i++) {
    const from = debugPoints[i]
    const to = debugPoints[i + 1]
    const segmentIndex = segments.length
    let duration: number
    if (segmentIndex === 0) {
      duration = FIRST_SEGMENT_DURATION
    } else if (segmentIndex === 1) {
      duration = SECOND_SEGMENT_DURATION
    } else {
      duration = randomBetween(RANDOM_SEGMENT_MIN_DURATION, RANDOM_SEGMENT_MAX_DURATION)
    }
    const isUnderlineSegment =
      (i === anchorIndex && i + 1 === underlineStartIndex && anchorIndex !== -1) ||
      (i === underlineStartIndex && i + 1 === underlineEndIndex && underlineStartIndex !== -1)
    if (isUnderlineSegment) {
      segments.push(createLinearSegment(from, to, duration))
    } else {
      const bias = to.y >= from.y ? "down" : "up"
      segments.push(createCurvedSegment(from, to, bias, duration))
    }
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

