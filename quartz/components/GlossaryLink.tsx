import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { FullSlug, resolveRelative } from "../util/path"

const GlossaryLink: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
  const href = resolveRelative(fileData.slug!, "Glossary/index" as FullSlug)
  return (
    <div class={classNames(displayClass, "title-button glossary-link")}>
      <h2>
        <a href={href}>Glossary</a>
      </h2>
    </div>
  )
}

export default (() => GlossaryLink) satisfies QuartzComponentConstructor
