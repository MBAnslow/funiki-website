import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title) {
    return <h1 class={classNames(displayClass, "article-title")}>{title}</h1>
  } else {
    return null
  }
}

ArticleTitle.css = `
.article-title {
  margin: -15px 0 0 0;
  font-size: 4.5rem;
  line-height: 1.3;
}

@media all and (max-width: 640px) {
  .article-title {
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-size: 3.4rem;
  }
}
`

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
