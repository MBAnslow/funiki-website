import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const buildShareUrl = (cfgBaseUrl: string | undefined, slug: string | undefined): string => {
  const base =
    cfgBaseUrl && cfgBaseUrl.startsWith("http")
      ? cfgBaseUrl
      : cfgBaseUrl
        ? `https://${cfgBaseUrl}`
        : ""

  if (!slug) {
    return base
  }

  try {
    return new URL(slug, base || "http://localhost").toString()
  } catch {
    return `${base}/${slug}`
  }
}

const ShareButtons: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
  const pageTitle = fileData.frontmatter?.title ?? fileData.slug ?? "this page"
  const shareUrl = buildShareUrl(cfg.baseUrl, fileData.slug)
  const summary =
    fileData.frontmatter?.summary ??
    fileData.frontmatter?.socialDescription ??
    fileData.frontmatter?.description ??
    fileData.description ??
    ""
  const shareText = summary ? `${pageTitle} — ${summary}` : pageTitle

  const encUrl = encodeURIComponent(shareUrl)
  const encTitle = encodeURIComponent(pageTitle)
  const encText = encodeURIComponent(shareText)

  const links = [
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encUrl}&title=${encTitle}&summary=${encText}`,
      icon: (
        <svg
          class="share-bar__icon"
          viewBox="0 0 24 24"
          width="50"
          height="50"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.026-3.037-1.852-3.037-1.853 0-2.135 1.445-2.135 2.939v5.667H9.352V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.602 0 4.268 2.37 4.268 5.455v6.286zM5.337 7.433c-1.144 0-2.069-.926-2.069-2.07 0-1.144.925-2.069 2.069-2.069 1.144 0 2.07.925 2.07 2.069 0 1.144-.926 2.07-2.07 2.07zm1.777 13.019H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .771 0 1.723v20.554C0 23.228.792 24 1.771 24h20.451C23.2 24 24 23.228 24 22.277V1.723C24 .771 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encUrl}&text=${encText}`,
      icon: (
        <svg
          class="share-bar__icon"
          viewBox="0 0 24 24"
          width="25"
          height="25"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M18.244 1.986h3.145l-6.868 7.843 8.086 10.185H16.54l-4.743-6.201-5.425 6.2H3.226l7.35-8.413L2.915 1.986h4.22l4.288 5.523 4.821-5.523z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      icon: (
        <svg
          class="share-bar__icon"
          viewBox="0 0 24 24"
          width="25"
          height="25"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.349C0 23.406.593 24 1.325 24h11.495v-9.294H9.692v-3.62h3.128V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.463.099 2.794.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.313h3.59l-.467 3.62h-3.123V24h6.116C23.406 24 24 23.406 24 22.675V1.326C24 .593 23.406 0 22.675 0z" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encUrl}&text=${encText}`,
      icon: (
        <svg
          class="share-bar__icon"
          viewBox="0 0 24 24"
          width="25"
          height="25"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M23.854 2.491a1.51 1.51 0 0 0-1.53-.268L1.64 10.69c-.66.263-.675 1.202-.025 1.486l4.9 2.136 2.25 5.918a1.011 1.011 0 0 0 1.756.245l2.6-3.29 4.827 3.512a1.5 1.5 0 0 0 2.357-.896l3.29-15.93a1.5 1.5 0 0 0-.741-1.68zM7.4 13.175l10.6-6.53-6.67 7.45a.75.75 0 0 0-.18.332l-.7 2.744-1.23-3.48a.75.75 0 0 0-.42-.436l-1.4-.58z" />
        </svg>
      ),
    },
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encText}%20${encUrl}`,
      icon: (
        <svg
          class="share-bar__icon"
          viewBox="0 0 24 24"
          width="25"
          height="25"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.62-6.003C.122 5.281 5.48 0 12.058 0c3.184 0 6.167 1.24 8.413 3.488a11.82 11.82 0 0 1 3.497 8.41c-.003 6.579-5.37 11.936-11.948 11.936a11.95 11.95 0 0 1-6.003-1.616L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.877.002-5.462-4.415-9.89-9.881-9.89-5.452 0-9.887 4.427-9.889 9.88a9.842 9.842 0 0 0 1.599 5.29l-.999 3.648 3.889-1.643zM17.29 14.7c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.03-.967-.272-.099-.47-.149-.669.149-.198.297-.768.966-.941 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.61-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
        </svg>
      ),
    },
    {
      name: "Email",
      href: `mailto:?subject=${encTitle}&body=${encText}%0A%0A${encUrl}`,
      icon: (
        <svg
          class="share-bar__icon"
          viewBox="0 0 24 24"
          width="25"
          height="25"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M12 13.065 1.5 6.75v10.5h21V6.75L12 13.065zm0-2.13L22.5 4.5h-21l10.5 6.435z" />
        </svg>
      ),
    },
  ]

  return (
    <div class="share-bar" aria-label="Share this page">
      <div class="share-bar__links">
        {links.map((link) => (
          <a
            class="share-bar__link"
            href={link.href}
            rel="noopener noreferrer"
            target="_blank"
            aria-label={`Share on ${link.name}`}
            title={`Share on ${link.name}`}
          >
            {link.icon}
          </a>
        ))}
      </div>
    </div>
  )
}

ShareButtons.css = `
.share-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  justify-content: flex-end;
  width: 100%;
  font-size: 0;
  color: var(--secondary);
}
.share-bar__links {
  align-items: center;
  gap: 0.45rem;
}
.share-bar__link {
  color: var(--secondary);
  text-decoration: none;
  font-weight: 600;
  display: inline-block;
  align-items: center;
  gap: 0.2rem;
  padding: 0.05rem;
}
.share-bar__link + .share-bar__link {
  margin-left: 0.4rem;
}
.share-bar__link:hover {
  color: var(--tertiary);
}
.share-bar__icon {
  width: 30px;
  height: 30px;
  display: inline-block;
  fill: currentColor;
  margin-right: 0.5rem;
  flex: 0 0 12px;
}
`

export default (() => ShareButtons) satisfies QuartzComponentConstructor
