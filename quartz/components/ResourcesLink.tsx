import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { FullSlug, resolveRelative } from "../util/path"

const ResourcesLink: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
  const href = resolveRelative(fileData.slug!, "resources" as FullSlug)
  return (
    <div class={classNames(displayClass, "title-button timeline-link")}>
      <h2>
        <a href={href}>Resources</a>
      </h2>
    </div>
  )
}

export default (() => ResourcesLink) satisfies QuartzComponentConstructor
