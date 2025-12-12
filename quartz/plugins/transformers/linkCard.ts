import { Root as MdRoot } from "mdast"
import { Plugin } from "unified"
import { visit } from "unist-util-visit"
import { QuartzTransformerPlugin } from "../types"

type Attrs = {
  title?: string
  desc?: string
  href?: string
  icon?: string
}

const parseAttrs = (raw: string): Attrs => {
  const attrs: Attrs = {}
  const regex = /(\w+)="([^"]*)"/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(raw)) !== null) {
    const [, key, value] = match
    attrs[key as keyof Attrs] = value
  }
  return attrs
}

const buildCard = (attrs: Attrs): string | null => {
  const title = attrs.title?.trim()
  const desc = attrs.desc?.trim()
  const href = attrs.href?.trim()
  if (!title || !href) return null
  const hrefSafe = attrs.href?.trim() ?? ""

  const safe = (v: string) => v.replace(/</g, "&lt;").replace(/>/g, "&gt;")

  return `<div class="callout" data-callout="link">
  <div class="callout-title">
    <div class="callout-icon"></div>
    <div class="callout-title-inner">
      <p>
        <a class="link-card__title" href="${hrefSafe}">
          <span>${safe(title)}</span>
        </a>
      </p>
    </div>
  </div>
  ${
    desc
      ? `<div class="callout-content">
    <p class="link-card__desc">${safe(desc)}</p>
  </div>`
      : ""
  }
</div>`
}

const linkCardRegex = /<LinkCard\b([^>]*)\/>/g

const linkCardTransformer: Plugin<[], MdRoot> = () => {
  return (tree) => {
    visit(tree, "html", (node: any) => {
      if (typeof node.value !== "string") return
      let changed = false
      node.value = node.value.replace(linkCardRegex, (_match: string, attrPart: string) => {
        const card = buildCard(parseAttrs(attrPart ?? ""))
        if (card) {
          changed = true
          return card
        }
        return _match
      })
      if (!changed) return
    })
  }
}

export const LinkCard: QuartzTransformerPlugin = () => {
  return {
    name: "LinkCard",
    markdownPlugins() {
      return [linkCardTransformer]
    },
  }
}
