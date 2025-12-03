import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const HeaderImage: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const headerImage = fileData.frontmatter?.headerImage
  if (!headerImage) {
    return null
  }

  const altText =
    fileData.frontmatter?.headerImageAlt ?? fileData.frontmatter?.title ?? "Header image"

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

