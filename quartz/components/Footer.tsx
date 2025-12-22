import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import ShareButtonsCtor from "./ShareButtons"
import { version } from "../../package.json"
import { i18n } from "../i18n"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const ShareButtons = ShareButtonsCtor()
  const Footer: QuartzComponent = (props: QuartzComponentProps) => {
    const { displayClass, cfg } = props
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    return (
      <footer class={`${displayClass ?? ""}`}>
        <div class="footer-share">
          <ShareButtons {...props} />
        </div>
        <p>
          {i18n(cfg.locale).components.footer.createdWith}{" "}
          <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a> © {year}
        </p>
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              <a href={link}>{text}</a>
            </li>
          ))}
        </ul>
      </footer>
    )
  }

  Footer.css = `${style}\n${ShareButtons.css ?? ""}`
  return Footer
}) satisfies QuartzComponentConstructor
