import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { FullSlug, resolveRelative } from "../util/path"

const ResourcesLink: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
  const href = resolveRelative(fileData.slug!, "resources" as FullSlug)
  return (
    <div class={classNames(displayClass, "timeline-link")}>
      <a class="timeline-link__anchor" href={href}>
        Resources
      </a>
    </div>
  )
}

export default (() => ResourcesLink) satisfies QuartzComponentConstructor

