import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { isAbsoluteURL, joinSegments, pathToRoot } from "../util/path"

const HeaderImage: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const headerImage = fileData.frontmatter?.headerImage
  if (typeof headerImage !== "string" || headerImage.length === 0) {
    return null
  }

  const headerImageAlt = fileData.frontmatter?.headerImageAlt
  const fallbackTitle = fileData.frontmatter?.title
  const altText =
    (typeof headerImageAlt === "string" && headerImageAlt.length > 0
      ? headerImageAlt
      : typeof fallbackTitle === "string" && fallbackTitle.length > 0
        ? fallbackTitle
        : "Header image") ?? "Header image"

  const headerImageSrc =
    headerImage.startsWith("/") || headerImage.startsWith("data:") || isAbsoluteURL(headerImage)
      ? headerImage
      : joinSegments(pathToRoot(fileData.slug!), headerImage)

  return (
    <figure class={classNames(displayClass, "header-image")}>
      <img src={headerImageSrc} alt={altText} loading="eager" decoding="async" />
    </figure>
  )
}

HeaderImage.css = `
.header-image {
  margin: 0;
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
}

.header-image img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  opacity: 0.9;
  margin: 0;
}

.header-image::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(ellipse 100% 100% at center 55%, #ffffff08 50%, #ededed 82%);
}

:root[saved-theme="dark"] .header-image::before {
  background: radial-gradient(ellipse 80% 100% at center 55%, #ffffff08 50%, #1a1a1a 82%);
}

.header-image::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: radial-gradient(ellipse 90% 150% at center 55%, transparent 28%, var(--light) 62%);
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  -webkit-mask-size: 200px 200px;
  -webkit-mask-repeat: repeat;
  mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mask-size: 200px 200px;
  mask-repeat: repeat;
}
`

export default (() => HeaderImage) satisfies QuartzComponentConstructor
