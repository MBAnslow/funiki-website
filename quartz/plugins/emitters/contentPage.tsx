import path from "path"
import fs from "fs/promises"
import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot } from "../../util/path"
import { defaultContentPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { Content } from "../../components"
import { styleText } from "util"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { Node } from "unist"
import { StaticResources } from "../../util/resources"
import { QuartzPluginData } from "../vfile"
import { isLandingSlug, landingSlugAliases, landingDuplicateTargets } from "../../util/landing"

async function processContent(
  ctx: BuildCtx,
  tree: Node,
  fileData: QuartzPluginData,
  allFiles: QuartzPluginData[],
  opts: FullPageLayout,
  resources: StaticResources,
) {
  const slug = fileData.slug!
  const cfg = ctx.cfg.configuration
  const externalResources = pageResources(pathToRoot(slug), resources)
  const componentData: QuartzComponentProps = {
    ctx,
    fileData,
    externalResources,
    cfg,
    children: [],
    tree,
    allFiles,
  }

  const content = renderPage(cfg, slug, componentData, opts, externalResources)
  return write({
    ctx,
    content,
    slug,
    ext: ".html",
  })
}

export const ContentPage: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultContentPageLayout,
    pageBody: Content(),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "ContentPage",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data)
      let containsLanding = false

      for (const [tree, file] of content) {
        const slug = file.data.slug!
        if (isLandingSlug(slug)) {
          containsLanding = true
        }

        // only process home page, non-tag pages, and non-index pages
        if (!isLandingSlug(slug) && (slug.endsWith("/index") || slug.startsWith("tags/"))) continue
        const outputPath = await processContent(ctx, tree, file.data, allFiles, opts, resources)
        yield outputPath
        if (isLandingSlug(slug)) {
          await duplicateLandingOutputs(ctx, slug)
        }
      }

      if (!containsLanding) {
        console.log(
          styleText(
            "yellow",
            `\nWarning: no landing page found. Ensure one of the following files exists: ${landingSlugAliases
              .map((slug) => `\`${slug}\``)
              .join(", ")}.`,
          ),
        )
      }
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      const allFiles = content.map((c) => c[1].data)

      // find all slugs that changed or were added
      const changedSlugs = new Set<string>()
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue
        if (changeEvent.type === "add" || changeEvent.type === "change") {
          changedSlugs.add(changeEvent.file.data.slug!)
        }
      }

      for (const [tree, file] of content) {
        const slug = file.data.slug!
        if (!changedSlugs.has(slug)) continue
        if (!isLandingSlug(slug) && (slug.endsWith("/index") || slug.startsWith("tags/"))) continue

        const outputPath = await processContent(ctx, tree, file.data, allFiles, opts, resources)
        yield outputPath
        if (isLandingSlug(slug)) {
          await duplicateLandingOutputs(ctx, slug)
        }
      }
    },
  }
}

async function duplicateLandingOutputs(ctx: BuildCtx, slug: string) {
  const targets = landingDuplicateTargets(slug)
  if (targets.length === 0) {
    return
  }

  const sourcePath = path.join(ctx.argv.output, `${slug}.html`)
  for (const target of targets) {
    const destinationPath = path.join(ctx.argv.output, `${target}.html`)
    if (destinationPath === sourcePath) continue
    await fs.mkdir(path.dirname(destinationPath), { recursive: true })
    await fs.copyFile(sourcePath, destinationPath)
  }
}
