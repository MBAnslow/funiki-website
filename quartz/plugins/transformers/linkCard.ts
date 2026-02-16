import { Root as MdRoot } from "mdast"
import { Plugin } from "unified"
import { visit } from "unist-util-visit"
import { QuartzTransformerPlugin } from "../types"

type Attrs = {
  title?: string
  desc?: string
  href?: string
  icon?: string
  hideDesc?: string
}

type ResourceEntry = {
  type: "link"
  title: string
  desc?: string
  href: string
  slug?: string
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

const buildCard = (attrs: Attrs, file: any): string | null => {
  const title = attrs.title?.trim()
  const desc = attrs.desc?.trim()
  const href = attrs.href?.trim()
  if (!title || !href) return null
  const hrefSafe = attrs.href?.trim() ?? ""
  const hideDesc = attrs.hideDesc?.toLowerCase() === "true"

  const safe = (v: string) => v.replace(/</g, "&lt;").replace(/>/g, "&gt;")

  // collect resource data for aggregation page
  const resources = (file.data.resources ??= [] as ResourceEntry[])
  resources.push({
    type: "link",
    title,
    desc,
    href,
    slug: file.data.slug?.toString(),
  })

  return `<div class="resource" data-resource="link">
  <div class="resource-header">
    <div class="resource-header-text">
      <span class="resource-icon resource-icon--link"></span><a class="resource-title" href="${hrefSafe}"><span>${safe(title)}</span></a>
    </div>
  </div>
  ${desc && !hideDesc ? `<div class="resource-content"><p class="resource-desc">${safe(desc)}</p></div>` : ""}
</div>`
}

const linkCardRegex = /<LinkCard\b([^>]*)\/>/g

const linkCardTransformer: Plugin<[], MdRoot> = () => {
  return (tree, file) => {
    visit(tree, "html", (node: any) => {
      if (typeof node.value !== "string") return
      let changed = false
      node.value = node.value.replace(linkCardRegex, (_match: string, attrPart: string) => {
        const card = buildCard(parseAttrs(attrPart ?? ""), file)
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
