import { FullSlug } from "./path"

const LANDING_SLUG_CANDIDATES = ["index", "about", "about/index"] as const
const LANDING_DUPLICATE_TARGETS = ["index"] as const

export const primaryLandingSlug = "About" as FullSlug
const primaryLandingSlugNormalized = primaryLandingSlug.toLowerCase()

export const landingSlugAliases = LANDING_SLUG_CANDIDATES

export function isLandingSlug(slug?: string | null): boolean {
  if (!slug) {
    return false
  }

  const normalized = slug.toLowerCase()
  return LANDING_SLUG_CANDIDATES.some((candidate) => normalized === candidate)
}

export function landingDuplicateTargets(slug?: string | null): FullSlug[] {
  if (!slug) {
    return []
  }

  const normalized = slug.toLowerCase()
  if (normalized !== primaryLandingSlugNormalized) {
    return []
  }

  return LANDING_DUPLICATE_TARGETS.filter((target) => target !== normalized).map(
    (target) => target as FullSlug,
  )
}
