import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { FullSlug, resolveRelative } from "../util/path"

const TimelineLink: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
  const href = resolveRelative(fileData.slug!, "timeline" as FullSlug)
  return (
    <div class={classNames(displayClass, "timeline-link")}>
      <a class="timeline-link__anchor" href={href}>
        Timeline
      </a>
    </div>
  )
}

TimelineLink.css = `
.timeline-link {
  margin: 0.5rem 0 0 0;
  padding: 0.25rem 0;
}

.timeline-link__anchor {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: clamp(1.9rem, 2.6vw, 2.3rem);
  font-family: var(--titleFont);
  color: var(--dark);
  text-decoration: none;
}

.timeline-link__anchor:hover {
  color: var(--dark);
}

`

export default (() => TimelineLink) satisfies QuartzComponentConstructor
