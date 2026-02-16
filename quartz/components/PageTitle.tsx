import { resolveRelative, type FullSlug } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { primaryLandingSlug, isLandingSlug } from "../util/landing"

const HIGHLIGHT_TITLE = "funiki"

const glowLetters = (title: string) =>
  title.split("").map((char, idx) => {
    if (char.toLowerCase() === "i") {
      return (
        <span key={idx} class="page-title__i glow-letter">
          {char}
          <span class="funiki-idot-anchor" aria-hidden="true"></span>
        </span>
      )
    }
    return (
      <span key={idx} class="glow-letter">
        {char}
      </span>
    )
  })

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const currentSlug = (fileData.slug ?? primaryLandingSlug) as FullSlug
  const homeHref = resolveRelative(currentSlug, primaryLandingSlug)
  const shouldGlow = isLandingSlug(fileData.slug)

  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={homeHref}>
        {shouldGlow && title.trim().toLowerCase() === HIGHLIGHT_TITLE ? glowLetters(title) : title}
      </a>
    </h2>
  )
}

PageTitle.css = `
.page-title {
  font-size: clamp(1.85rem, 4.4vw, 2.8rem);
  margin: 0;
  font-family: var(--titleFont);
  line-height: 1.05;
}

.page-title__i {
  position: relative;
  display: inline-block;
}

.glow-letter {
  position: relative;
  display: inline-block;
}

.funiki-idot-anchor {
  position: absolute;
  width: clamp(6px, 0.28em, 12px);
  height: clamp(6px, 0.28em, 12px);
  border-radius: 50%;
  top: -0.6em;
  left: 50%;
  transform: translate(-50%, 0);
  pointer-events: none;
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
