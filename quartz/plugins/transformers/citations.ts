import rehypeCitation from "rehype-citation"
import { PluggableList } from "unified"
import { visit } from "unist-util-visit"
import type { Element, Parent } from "hast"
import { QuartzTransformerPlugin } from "../types"

export interface Options {
  bibliographyFile: string
  suppressBibliography: boolean
  linkCitations: boolean
  csl: string
}

const defaultOptions: Options = {
  bibliographyFile: "./bibliography.bib",
  suppressBibliography: false,
  linkCitations: false,
  csl: "apa",
}

export const Citations: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "Citations",
    htmlPlugins(ctx) {
      const plugins: PluggableList = []
      const bibliographyHeading = "References"

      // Add rehype-citation to the list of plugins
      plugins.push([
        rehypeCitation,
        {
          bibliography: opts.bibliographyFile,
          suppressBibliography: opts.suppressBibliography,
          linkCitations: opts.linkCitations,
          csl: opts.csl,
          lang: ctx.cfg.configuration.locale ?? "en-US",
        },
      ])

      // Transform the HTML of the citattions; add data-no-popover property to the citation links
      // using https://github.com/syntax-tree/unist-util-visit as they're just anochor links
      plugins.push(() => {
        return (tree, _file) => {
          let insertedHeading = false

          const hasClassName = (node: Element, className: string) => {
            const classes = node.properties?.className
            if (Array.isArray(classes)) {
              return classes.includes(className)
            }
            if (typeof classes === "string") {
              return classes.split(" ").includes(className)
            }
            return false
          }

          const getNodeText = (node: any): string => {
            if (!node) return ""
            if (node.type === "text") return String(node.value ?? "")
            if (!node.children) return ""
            return node.children.map(getNodeText).join("")
          }

          const hasReferencesHeading = (parent: Parent, beforeIndex: number) => {
            if (!parent?.children) return false
            return parent.children.slice(0, beforeIndex).some((child: any) => {
              if (!child || child.type !== "element") return false
              if (!/^h[1-6]$/.test(child.tagName)) return false
              return getNodeText(child).trim() === bibliographyHeading
            })
          }

          const isBibliographyContainer = (node: Element) => {
            if (!node || node.type !== "element") return false
            const id = node.properties?.id
            return (
              id === "refs" ||
              id === "bibliography" ||
              hasClassName(node, "references") ||
              hasClassName(node, "csl-bib-body") ||
              hasClassName(node, "bibliography")
            )
          }

          visit(tree, "element", (node: Element) => {
            const href = node.properties?.href
            if (node.tagName === "a" && typeof href === "string" && href.startsWith("#bib")) {
              node.properties["data-no-popover"] = true
            }
          })

          if (!opts.suppressBibliography) {
            visit(tree, "element", (node: Element, index, parent) => {
              if (insertedHeading || !isBibliographyContainer(node)) {
                return
              }

              if (
                parent &&
                typeof index === "number" &&
                !hasReferencesHeading(parent as Parent, index)
              ) {
                parent.children.splice(index, 0, {
                  type: "element",
                  tagName: "h2",
                  properties: { id: "references" },
                  children: [
                    {
                      type: "text",
                      value: bibliographyHeading,
                    },
                  ],
                })
              }

              insertedHeading = true
            })
          }
        }
      })

      return plugins
    },
  }
}
