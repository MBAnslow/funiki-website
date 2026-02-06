import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { isLandingSlug } from "./quartz/util/landing"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({ links: {} }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.HeaderImage(),
    Component.Flex({
      components: [
        {
          Component: Component.Spacer(),
          grow: true,
        },
        {
          Component: Component.Flex({
            components: [
              { Component: Component.Darkmode() },
              { Component: Component.ReaderMode() },
              { Component: Component.Search({ iconOnly: true }) },
            ],
            gap: "0.5rem",
          }),
          align: "center",
          justify: "end",
        },
      ],
      gap: "0.5rem",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.ConditionalRender({
      component: Component.ResourcesContent(),
      condition: (page) => page.fileData.slug === "resources",
    }),
    Component.ConditionalRender({
      component: Component.TimelineContent(),
      condition: (page) => page.fileData.slug === "timeline",
    }),
    Component.ConditionalRender({
      component: Component.GlossaryContent(),
      condition: (page) => {
        const slug = page.fileData.slug?.toLowerCase() ?? ""
        return slug === "glossary" || slug === "glossary/index" || slug === "glossary/_index"
      },
    }),
    Component.TagList(),
  ],
  left: [
    Component.ConditionalRender({
      component: Component.GlowingOrb(),
      condition: (page) => isLandingSlug(page.fileData.slug),
    }),
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Explorer(),
    Component.TimelineLink(),
    Component.GlossaryLink(),
    Component.ResourcesLink(),
  ],
  right: [Component.DesktopOnly(Component.TableOfContents()), Component.Backlinks()],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Flex({
      components: [
        {
          Component: Component.Spacer(),
          grow: true,
        },
        {
          Component: Component.Flex({
            components: [
              { Component: Component.Darkmode() },
              { Component: Component.ReaderMode() },
              { Component: Component.Search({ iconOnly: true }) },
            ],
            gap: "0.5rem",
          }),
          align: "center",
          justify: "end",
        },
      ],
      gap: "0.5rem",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.ConditionalRender({
      component: Component.GlossaryContent(),
      condition: (page) => {
        const slug = page.fileData.slug?.toLowerCase() ?? ""
        return slug === "glossary" || slug === "glossary/index" || slug === "glossary/_index"
      },
    }),
  ],
  left: [
    Component.ConditionalRender({
      component: Component.GlowingOrb(),
      condition: (page) => isLandingSlug(page.fileData.slug),
    }),
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Explorer(),
    Component.TimelineLink(),
    Component.GlossaryLink(),
    Component.ResourcesLink(),
  ],
  right: [],
}
