import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const HIGHLIGHT_TITLE = "funiki"

const glowLetters = (title: string) => title.split("").map((char, idx) => {
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
  const baseDir = pathToRoot(fileData.slug!)

  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir}>
        {title.trim().toLowerCase() === HIGHLIGHT_TITLE ? glowLetters(title) : title}
      </a>
    </h2>
  )
}

PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
  font-family: var(--titleFont);
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
  width: 6px;
  height: 6px;
  border-radius: 50%;
  top: -0.65rem;
  left: 50%;
  transform: translate(-50%, 0);
  pointer-events: none;
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
