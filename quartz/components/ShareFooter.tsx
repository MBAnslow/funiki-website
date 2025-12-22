import FooterCtor from "./Footer"
import ShareButtonsCtor from "./ShareButtons"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Footer = FooterCtor({ links: {} })
const ShareButtons = ShareButtonsCtor()
const childCss = `${ShareButtons.css ?? ""}\n${Footer.css ?? ""}`

const ShareFooter: QuartzComponent = (props: QuartzComponentProps) => (
  <div class="share-footer">
    <div class="share-footer__buttons">
      <ShareButtons {...props} />
    </div>
    <Footer {...props} />
  </div>
)

ShareFooter.css = `
${childCss}
.share-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  opacity: 1;
}
.share-footer__buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
.share-footer .share-bar {
  opacity: 1;
  color: var(--dark);
}
`

export default (() => ShareFooter) satisfies QuartzComponentConstructor
