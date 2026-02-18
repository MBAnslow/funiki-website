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
  margin: 1.5rem 0 0 0;
}

.header-image img {
  width: 100%;
  height: auto;
  border-radius: 0.75rem;
  display: block;
  object-fit: cover;
  opacity: 0.9;
}
`

export default (() => HeaderImage) satisfies QuartzComponentConstructor
