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
      const summaryRaw = page.frontmatter?.summary
      const summary = typeof summaryRaw === "string" ? summaryRaw : ""
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
              {groups.get(letter)!.map(({ page, title, summary }) => {
                const trimmedSummary = summary.trim()
                const summaryText = trimmedSummary.length > 0 ? ` — ${trimmedSummary}` : ""
                return (
                  <li class="section-li">
                    <div class="section">
                      <div class="desc glossary-row">
                        <p class="glossary-line">
                          <span class="glossary-summary">
                            <a
                              href={resolveRelative(fileData.slug!, page.slug!)}
                              class="internal glossary-term"
                            >
                              {title}
                            </a>
                            {summaryText}
                          </span>
                        </p>
                      </div>
                    </div>
                  </li>
                )
              })}
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

.glossary-group {
  margin: 1rem 0 1.25rem;
}

.glossary-letter {
  margin: 0 0 0.5rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 1.5em;
}

.glossary-line {
  margin: 0;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
}

.glossary-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
}

.glossary-term {
  font-weight: 600;
}

.glossary-summary {
  margin: 0;
  color: var(--darkgray);
}
`

export default (() => GlossaryContent) satisfies QuartzComponentConstructor
