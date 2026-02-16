import { Root as MdRoot } from "mdast"
import { Plugin } from "unified"
import { visit } from "unist-util-visit"
import { QuartzTransformerPlugin } from "../types"
import { isAbsoluteURL, joinSegments, pathToRoot } from "../../util/path"

type Attrs = {
  title?: string
  desc?: string
  src?: string
  hideDesc?: string
}

type ResourceEntry = {
  type: "pdf"
  title: string
  desc?: string
  src: string
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

const resolveSrc = (src: string, file: any): string => {
  if (isAbsoluteURL(src)) return src
  if (src.startsWith("/")) {
    const slug = file.data.slug?.toString()
    if (!slug) return src
    const root = pathToRoot(slug)
    const cleaned = src.replace(/^\/+/, "")
    return joinSegments(root, cleaned)
  }
  return src
}

const buildCard = (attrs: Attrs, file: any): string | null => {
  const title = attrs.title?.trim()
  const desc = attrs.desc?.trim()
  const src = attrs.src?.trim()
  if (!title || !src) return null
  const hideDesc = attrs.hideDesc?.toLowerCase() === "true"
  const safe = (v: string) => v.replace(/</g, "&lt;").replace(/>/g, "&gt;")

  // Use resolveSrc only for the resources metadata; the HTML href/src
  // are left unresolved so that CrawlLinks can resolve them once
  // (avoiding a double pathToRoot that breaks subdirectory deploys).
  const resolvedSrc = resolveSrc(src, file)
  const resources = (file.data.resources ??= [] as ResourceEntry[])
  resources.push({
    type: "pdf",
    title,
    desc,
    src: resolvedSrc,
    slug: file.data.slug?.toString(),
  })

  return `<div class="resource" data-resource="pdf">
  <div class="resource-header">
    <div class="resource-header-text">
      <span class="resource-icon resource-icon--pdf"></span><a class="resource-title" href="${safe(src)}"><span>${safe(title)}</span></a>${desc && !hideDesc ? `<span class="resource-desc"> — ${safe(desc)}</span>` : ""}
    </div>
  </div>
  <div class="resource-content">
    <div class="pdf-callout-embed">
      <iframe class="pdf" src="${safe(src)}" title="${safe(title)}"></iframe>
    </div>
  </div>
</div>`
}

const pdfCardRegex = /<PdfCard\b([^>]*)\/>/g

const pdfCardTransformer: Plugin<[], MdRoot> = () => {
  return (tree, file) => {
    visit(tree, "html", (node: any) => {
      if (typeof node.value !== "string") return
      node.value = node.value.replace(pdfCardRegex, (_match: string, attrPart: string) => {
        const card = buildCard(parseAttrs(attrPart ?? ""), file)
        return card ?? _match
      })
    })
  }
}

export const PdfCard: QuartzTransformerPlugin = () => {
  return {
    name: "PdfCard",
    markdownPlugins() {
      return [pdfCardTransformer]
    },
  }
}
