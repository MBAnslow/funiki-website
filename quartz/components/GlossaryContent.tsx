import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { isFolderPath, resolveRelative } from "../util/path"

const removeNumericPrefix = (value?: string) => {
  if (!value) return value
  return value.replace(/^\d+[_-\s]+/, "")
}

const GlossaryContent: QuartzComponent = ({ allFiles, fileData }: QuartzComponentProps) => {
  const pages = allFiles
    .filter((page) => {
      const slug = page.slug ?? ""
      const tags = (page.frontmatter?.tags ?? []).map((tag) => tag.toLowerCase())
      const inGlossaryFolder = slug.toLowerCase().startsWith("glossary/")
      const hasGlossaryTag = tags.includes("glossary")
      return (
        (!!page.frontmatter?.title || !!slug) &&
        (inGlossaryFolder || hasGlossaryTag) &&
        !isFolderPath(slug)
      )
    })
    .map((page) => {
      const slugSegment = page.slug?.split("/").filter(Boolean).pop()
      const cleanedTitle =
        removeNumericPrefix(page.frontmatter?.title) ?? removeNumericPrefix(slugSegment)
      const title = cleanedTitle ?? page.frontmatter?.title ?? slugSegment ?? ""
      const summary = page.frontmatter?.summary ?? ""
      return { page, title, summary }
    })
    .filter(({ title }) => title.trim().length > 0)
    .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()))

  if (pages.length === 0) {
    return (
      <section class="glossary-content">
        <p>No glossary entries found yet.</p>
      </section>
    )
  }

  return (
    <section class="glossary-content">
      {(() => {
        const groups = new Map<string, typeof pages>()
        for (const entry of pages) {
          const firstChar = entry.title.trim().charAt(0).toUpperCase()
          const letter = /^[A-Z]$/.test(firstChar) ? firstChar : "#"
          if (!groups.has(letter)) {
            groups.set(letter, [])
          }
          groups.get(letter)!.push(entry)
        }

        const orderedLetters = Array.from(groups.keys()).sort((a, b) => {
          if (a === "#") return 1
          if (b === "#") return -1
          return a.localeCompare(b)
        })

        return orderedLetters.map((letter) => (
          <div class="glossary-group">
            <h3 class="glossary-letter" id={`glossary-${letter.toLowerCase()}`}>
              {letter}
            </h3>
            <ul class="section-ul">
              {groups.get(letter)!.map(({ page, title, summary }) => (
                <li class="section-li">
                  <div class="section">
                    <div class="desc">
                      <h4>
                        <a href={resolveRelative(fileData.slug!, page.slug!)} class="internal">
                          {title}
                        </a>
                      </h4>
                      {summary.trim().length > 0 && (
                        <p class="glossary-summary">{summary.trim()}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      })()}
    </section>
  )
}

GlossaryContent.css = `
.glossary-content {
  margin: 1.25rem 0;
}

.glossary-content .section {
  display: block !important;
  width: 100%;
  grid-template-columns: 1fr !important;
}

.glossary-content .desc {
  width: 100%;
}

.glossary-content .section h3 {
  margin: 0;
}

.glossary-group {
  margin: 1rem 0 1.25rem;
}

.glossary-letter {
  margin: 0 0 0.5rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.glossary-group .section h4 {
  margin: 0;
}

.glossary-summary {
  margin: 0.2rem 0 0;
  color: var(--darkgray);
  width: 100%;
  display: block;
}
`

export default (() => GlossaryContent) satisfies QuartzComponentConstructor
