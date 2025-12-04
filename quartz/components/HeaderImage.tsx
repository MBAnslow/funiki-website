import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

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

  return (
    <figure class={classNames(displayClass, "header-image")}>
      <img src={headerImage} alt={altText} loading="eager" decoding="async" />
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
}
`

export default (() => HeaderImage) satisfies QuartzComponentConstructor

