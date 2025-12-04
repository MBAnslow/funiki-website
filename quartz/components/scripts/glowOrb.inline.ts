const FADE_IN_HOLD_MS = 350

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

const createPath = (start: Point, end: Point, direction: "down" | "up"): PathSegment => {
  const offsetY = direction === "down" ? randomBetween(12, 28) : randomBetween(-26, -10)
  const control1: Point = {
    x: start.x + randomBetween(-40, 40),
    y: start.y + offsetY,
  }
  const control2: Point = {
    x: end.x + randomBetween(-40, 40),
    y: end.y + (direction === "down" ? randomBetween(-18, 6) : randomBetween(12, 32)),
  }
  return {
    start,
    control1,
    control2,
    end,
    duration: direction === "down" ? 4500 : 5000,
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
  const initialPosition = anchorStartPoint ?? underlineStartPoint ?? fallbackStart
  if (!initialPosition) return
  let start: Point = underlineEndPoint ?? underlineStartPoint ?? initialPosition

  const buildIntroSegments = (): PathSegment[] => {
    const segments: PathSegment[] = []
    if (anchorStartPoint && underlineStartPoint) {
      segments.push(createPath(anchorStartPoint, underlineStartPoint, "down"))
    }
    if (!underlineStartPoint || !underlineEndPoint) {
      return segments
    }
    const distance = Math.abs(underlineEndPoint.x - underlineStartPoint.x)
    if (distance < 2) {
      start = underlineStartPoint
      return segments
    }
    const duration = Math.max(4000, distance * 18)
    segments.push(createLinearSegment(underlineStartPoint, underlineEndPoint, duration))
    start = underlineEndPoint
    return segments
  }

  const buildFlowSegments = (): PathSegment[] => {
    const exitPoint: Point = {
      x: start.x + randomBetween(-60, 60),
      y: -orb.offsetHeight * 2,
    }
    const sweep = {
      x: start.x + randomBetween(-30, 30),
      y: start.y + randomBetween(8, 18),
    }
    return [createPath(start, sweep, "down"), createPath(sweep, exitPoint, "up")]
  }

  const introSegments = buildIntroSegments()
  const flowSegments = buildFlowSegments()
  const segments = [...introSegments, ...flowSegments]

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

