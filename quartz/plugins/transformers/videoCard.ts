import { Root as MdRoot } from "mdast"
import { Plugin } from "unified"
import { visit } from "unist-util-visit"
import { QuartzTransformerPlugin } from "../types"

type Attrs = {
  title?: string
  desc?: string
  src?: string
  icon?: string
  hideDesc?: string
}

type ResourceEntry = {
  type: "video"
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

const buildCard = (attrs: Attrs, file: any): string | null => {
  const title = attrs.title?.trim()
  const desc = attrs.desc?.trim()
  const src = attrs.src?.trim()
  if (!title || !src) return null
  const safe = (v: string) => v.replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const icon = attrs.icon?.trim()
  const hideDesc = attrs.hideDesc?.toLowerCase() === "true"

  const resources = (file.data.resources ??= [] as ResourceEntry[])
  resources.push({
    type: "video",
    title,
    desc,
    src,
    slug: file.data.slug?.toString(),
  })

  return `<div class="resource" data-resource="video">
  <div class="resource-header">
    <div class="resource-header-text">
      <span class="resource-icon resource-icon--video"${icon ? ` data-video-icon="${safe(icon)}"` : ""}></span><span class="resource-title">${safe(title)}</span>${desc && !hideDesc ? `<span class="resource-desc"> — ${safe(desc)}</span>` : ""}
    </div>
  </div>
  <div class="resource-content">
    <div class="video-callout-embed">
      <iframe src="${safe(src)}" title="${safe(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
  </div>
</div>`
}

const videoCardRegex = /<VideoCard\b([^>]*)\/>/g

const videoCardTransformer: Plugin<[], MdRoot> = () => {
  return (tree, file) => {
    visit(tree, "html", (node: any) => {
      if (typeof node.value !== "string") return
      node.value = node.value.replace(videoCardRegex, (_match: string, attrPart: string) => {
        const card = buildCard(parseAttrs(attrPart ?? ""), file)
        return card ?? _match
      })
    })
  }
}

export const VideoCard: QuartzTransformerPlugin = () => {
  return {
    name: "VideoCard",
    markdownPlugins() {
      return [videoCardTransformer]
    },
  }
}
