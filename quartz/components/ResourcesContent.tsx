import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

type ResourceEntry = {
  type: "link" | "video"
  title: string
  desc?: string
  href?: string
  src?: string
  slug?: string
}

const ResourcesContent: QuartzComponent = ({ allFiles }: QuartzComponentProps) => {
  const resources: ResourceEntry[] = allFiles.flatMap((f) => (f as any).resources ?? [])

  if (resources.length === 0) {
    return (
      <section class="resources-content">
        <h2>Resources</h2>
        <p>No resources found yet.</p>
      </section>
    )
  }

  return (
    <section class="resources-content">
      <h2>Resources</h2>
      <div class="resources-grid">
        {resources.map((res) => (
          <div class="resource" data-resource={res.type}>
            <div class="resource-title">
              <div class={`resource-icon resource-icon--${res.type}`}></div>
              <div class="resource-title-inner">
                {res.type === "link" && res.href ? (
                  <a class="link-card__title" href={res.href}>
                    <span>{res.title}</span>
                  </a>
                ) : (
                  <p>{res.title}</p>
                )}
              </div>
            </div>
            {(res.desc || res.type === "video") && (
              <div class="resource-content">
                {res.desc && <p>{res.desc}</p>}
                {res.type === "video" && res.src && (
                  <div class="video-callout-embed">
                    <iframe
                      src={res.src}
                      title={res.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

ResourcesContent.css = `
.resources-content {
  margin: 1rem 0 2rem;
}
.resources-content h2 {
  margin: 0 0 1rem;
}
.resources-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.resource .resource-title-inner p {
  margin: 0;
}
`

export default (() => ResourcesContent) satisfies QuartzComponentConstructor

