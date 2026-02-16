import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"

type ResourceEntry = {
  type: "link" | "video" | "pdf"
  title: string
  desc?: string
  href?: string
  src?: string
  slug?: string
}

const ResourcesContent: QuartzComponent = ({ allFiles, fileData }: QuartzComponentProps) => {
  const sources = allFiles
    .map((f) => ({
      slug: f.slug,
      title: f.frontmatter?.title ?? f.slug ?? "",
      resources: ((f as any).resources as ResourceEntry[]) ?? [],
    }))
    .filter((s) => s.resources.length > 0)

  if (sources.length === 0) {
    return (
      <section class="resources-content">
        <h2>All resources found across posts:</h2>
        <p>No resources found yet.</p>
      </section>
    )
  }

  return (
    <section class="resources-content">
      <h2>All resources found across posts:</h2>
      {sources.map((source) => (
        <div class="resource-source">
          <div class="resource-source__header">
            <span class="resource-source__label">... from</span>{" "}
            <a href={resolveRelative(fileData.slug!, source.slug as FullSlug)}>{source.title}</a>
          </div>
          <div class="resources-grid">
            {source.resources.map((res) => (
              <div class="resource" data-resource={res.type}>
                <div class="resource-header">
                  {res.type === "link" && res.href ? (
                    <div class="resource-header-text">
                      <span class={`resource-icon resource-icon--${res.type}`}></span>
                      <a class="resource-title resource-link" href={res.href}>
                        <span>{res.title}</span>
                      </a>
                    </div>
                  ) : res.type === "pdf" && res.src ? (
                    <div class="resource-header-text">
                      <span class="resource-icon resource-icon--pdf"></span>
                      <a class="resource-title resource-link" href={res.src}>
                        <span>{res.title}</span>
                      </a>
                      {res.desc && <span class="resource-desc"> — {res.desc}</span>}
                    </div>
                  ) : (
                    <div class="resource-header-text">
                      <span class={`resource-icon resource-icon--${res.type}`}></span>
                      <span class="resource-title">{res.title}</span>
                      {res.desc && <span class="resource-desc"> — {res.desc}</span>}
                    </div>
                  )}
                </div>
                {(res.type === "video" ||
                  res.type === "pdf" ||
                  (res.type === "link" && res.desc)) && (
                  <div class="resource-content">
                    {res.type === "link" && res.desc && <p class="resource-desc">{res.desc}</p>}
                    {res.type === "video" && res.src && (
                      <div class="video-callout-embed">
                        <iframe
                          src={res.src}
                          title={res.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen={true}
                        ></iframe>
                      </div>
                    )}
                    {res.type === "pdf" && res.src && (
                      <div class="pdf-callout-embed">
                        <iframe class="pdf" src={res.src} title={res.title}></iframe>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

ResourcesContent.css = `
.resources-content {
  margin: 1rem 0 2rem;
}
.resources-content h2 {
  margin: 0 0 1rem;
  color: var(--darkgray);
}
.resource-source {
  margin-bottom: 1.5rem;
}
.resource-source__header {
  margin: 0 0 0.5rem;
  font-size: clamp(1.2rem, 2vw, 1.4rem);
  font-weight: 700;
  text-align: right;
}
.resource-source__label {
  font-weight: 600;
  color: var(--darkgray);
  margin-right: 0.25rem;
}
.resource-source__header a {
  color: var(--secondary);
  text-decoration: none;
}
.resource-source__header a:hover {
  color: var(--tertiary);
}
.resources-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.resource .resource-header-text p {
  margin: 0;
}
`

export default (() => ResourcesContent) satisfies QuartzComponentConstructor
