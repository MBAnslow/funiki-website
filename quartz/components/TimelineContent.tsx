import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { byDateAndAlphabetical } from "./PageList"
import { FullSlug, isFolderPath, resolveRelative } from "../util/path"
import { Date, getDate } from "./Date"

const removeNumericPrefix = (value?: string) => {
  if (!value) return value
  return value.replace(/^\d+[_-\s]+/, "")
}

const isIndexSlug = (slug?: string) =>
  slug === "index" || slug?.endsWith("/index") || slug?.endsWith("/_index")

const TimelineContent: QuartzComponent = ({ allFiles, cfg, fileData }: QuartzComponentProps) => {
  const pages = allFiles
    .filter((page) => {
      const slug = page.slug ?? ""
      return (
        !!page.frontmatter?.title &&
        !isIndexSlug(slug) &&
        slug !== "timeline" &&
        !slug.startsWith("tags/") &&
        !isFolderPath(slug)
      )
    })
    .sort(byDateAndAlphabetical(cfg))

  return (
    <section class="timeline-content">
      <h2>All articles (newest first)</h2>
      <ul class="section-ul">
        {pages.map((page) => {
          const slugSegment = page.slug?.split("/").filter(Boolean).pop()
          const cleanedTitle =
            removeNumericPrefix(page.frontmatter?.title) ?? removeNumericPrefix(slugSegment)
          const title = cleanedTitle ?? page.frontmatter?.title ?? slugSegment ?? ""
          const tags = page.frontmatter?.tags ?? []

          return (
            <li class="section-li">
              <div class="section">
                <p class="meta content-meta">
                  {page.dates && <Date date={getDate(cfg, page)!} locale={cfg.locale} />}
                </p>
                <div class="desc">
                  <h3>
                    <a href={resolveRelative(fileData.slug!, page.slug!)} class="internal">
                      {title}
                    </a>
                  </h3>
                </div>
                {tags.length > 0 && (
                  <ul class="tags">
                    {tags.map((tag) => (
                      <li>
                        <a
                          class="internal tag-link"
                          href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}
                        >
                          {tag}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

TimelineContent.css = `
.timeline-content {
  margin: 1.25rem 0;
}

.timeline-content h2 {
  margin: 0 0 0.75rem;
  color: var(--darkgray);
}

.timeline-content .section h3 {
  margin: 0;
}

.timeline-content .section > .tags {
  margin: 0.35rem 0 0;
}
`

export default (() => TimelineContent) satisfies QuartzComponentConstructor
