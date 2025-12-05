const FADE_IN_HOLD_MS = 350
const LOOP_DELAY_MS = 1200
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
const SVG_NS = "http://www.w3.org/2000/svg"
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

type DebugArtifacts = {
  overlay: HTMLElement
  markers: HTMLElement[]
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
    pathData = points
      .map((point, idx) => `${idx === 0 ? "M" : "L"}${formatPoint(point)}`)
      .join(" ")
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

const animateOrb = (orb: HTMLElement) => {
  if (orb.dataset.orbAnimated === "true") return
  orb.dataset.orbAnimated = "true"
  const container = orb.closest<HTMLElement>(".sidebar.left") ?? orb.closest<HTMLElement>(".landing-shell")
  if (!container) return
  const isSidebar = container.classList.contains("sidebar")
  const shouldLoop = !isSidebar
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
        x: lastIEntry.rect.left + lastIEntry.rect.width / 2 - contextRect.left - orb.offsetWidth / 2,
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

  const hoverReferencePoint = underlineEndPoint ?? underlineStartPoint ?? null

  const randomHoverPoint = (): Point => {
    const maxX = contextRect.width
    const minX = Math.max(
      0,
      (leftmostLetter?.rect.left ?? contextRect.left) - contextRect.left - 20,
    )
    const maxClampX =
      Math.min(
        maxX,
        (rightmostLetter?.rect.right ?? contextRect.left + maxX) - contextRect.left + 20,
      ) - orb.offsetWidth
    const centerX = randomBetween(minX, Math.max(minX + 1, maxClampX))
    const topLimit =
      (Math.min(...letterEntries.map(({ rect }) => rect.top)) ?? contextRect.top) -
      contextRect.top -
      30
    const bottomReference = hoverReferencePoint ?? underlineStartPoint ?? { y: 60 }
    const bottomLimit = bottomReference.y - 10
    const centerY = randomBetween(topLimit, bottomLimit)
    return {
      x: centerX - orb.offsetWidth / 2,
      y: centerY - orb.offsetHeight / 2,
    }
  }

  const randomOffscreenPoint = (): Point => {
    const width = contextRect.width
    const height = contextRect.height
    const marginX = Math.max(60, orb.offsetWidth * 2)
    const marginY = Math.max(60, orb.offsetHeight * 2)
    const side = Math.floor(Math.random() * 4)
    const randomX = () => randomBetween(-marginX, width + marginX)
    const randomY = () => randomBetween(-marginY, height + marginY)
    switch (side) {
      case 0: // top
        return {
          x: randomX() - orb.offsetWidth / 2,
          y: -marginY - orb.offsetHeight,
        }
      case 1: // right
        return {
          x: width + marginX,
          y: randomY() - orb.offsetHeight / 2,
        }
      case 2: // bottom
        return {
          x: randomX() - orb.offsetWidth / 2,
          y: height + marginY,
        }
      default: // left
        return {
          x: -marginX - orb.offsetWidth,
          y: randomY() - orb.offsetHeight / 2,
        }
    }
  }

  const createArcOverLastISegment = (start: Point, end: Point, duration: number): PathSegment => {
    if (!lastIArcPeak) {
      return createCurvedSegment(start, end, "up", duration)
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
    pushPoint(randomHoverPoint())
    let guard = 0
    while (debugPoints.length < MAX_TRAJECTORY_POINTS - 1 && guard < 200) {
      const before = debugPoints.length
      pushPoint(randomHoverPoint())
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
      pushPoint(randomHoverPoint())
      guard = debugPoints.length === before ? guard + 1 : 0
    }

    if (secondAnchorPoint) {
      pushPoint(secondAnchorPoint)
    }
  }

  if (container.classList.contains("landing-shell")) {
    buildLandingTrajectory()
  } else {
    buildLetterTrajectory()
  }

  if (debugPoints.length === 0) {
    pushPoint(fallbackStart)
  }

  if (debugPoints.length > 0) {
    pushPoint(randomOffscreenPoint())
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
    let segment: PathSegment
    if (movementIndex === 0) {
      segment = createArcOverLastISegment(from, to, duration)
    } else {
      const useCurvedSegment = movementIndex >= 3
      const bias: "down" | "up" = to.y >= from.y ? "down" : "up"
      segment = useCurvedSegment
        ? createCurvedSegment(from, to, bias, duration)
        : createLinearSegment(from, to, duration)
    }
    segments.push(segment)
    movementIndex += 1
  }

  const debugEnabled = ENABLE_ORB_DEBUG || container.dataset.orbDebug === "true"
  const debugArtifacts = renderDebugPoints(container, orb, debugPoints, segments, debugEnabled, contextRect)
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
