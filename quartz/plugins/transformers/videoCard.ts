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
  const src = attrs.src?.trim()
  if (!title || !src) return null
  const safe = (v: string) => v.replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const icon = attrs.icon?.trim()
  const hideDesc = attrs.hideDesc?.toLowerCase() === "true"

  return `<div class="resource" data-resource="video">
  <div class="resource-title">
    <div class="resource-icon resource-icon--video"${icon ? ` data-video-icon="${safe(icon)}"` : ""}></div>
    <div class="resource-title-inner">
      <p><span>${safe(title)}</span></p>
    </div>
  </div>
  ${
    hideDesc && !desc
      ? `<div class="resource-content">
    <div class="video-callout-embed">
      <iframe src="${safe(src)}" title="${safe(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
  </div>`
      : `<div class="resource-content">
    ${desc && !hideDesc ? `<p class="link-card__desc">${safe(desc)}</p>` : ""}
    <div class="video-callout-embed">
      <iframe src="${safe(src)}" title="${safe(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
  </div>`
  }
</div>`
}

const videoCardRegex = /<VideoCard\b([^>]*)\/>/g

const videoCardTransformer: Plugin<[], MdRoot> = () => {
  return (tree) => {
    visit(tree, "html", (node: any) => {
      if (typeof node.value !== "string") return
      node.value = node.value.replace(videoCardRegex, (_match: string, attrPart: string) => {
        const card = buildCard(parseAttrs(attrPart ?? ""))
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
