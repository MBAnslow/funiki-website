import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      Repository: "https://github.com/MBAnslow/funiki-website",
      "Quartz Docs": "https://quartz.jzhao.xyz/",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Flex({
      components: [
        {
          Component: Component.ConditionalRender({
            component: Component.Breadcrumbs(),
            condition: (page) => page.fileData.slug !== "index",
          }),
          grow: true,
          align: "start",
          justify: "start",
        },
        {
          Component: Component.Flex({
            components: [
              { Component: Component.Darkmode() },
              { Component: Component.ReaderMode() },
            ],
            gap: "0.5rem",
          }),
          align: "center",
          justify: "end",
        },
      ],
      gap: "0.5rem",
    }),
    Component.HeaderImage(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
      ],
    }),
    Component.Explorer(),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Flex({
      components: [
        {
          Component: Component.Breadcrumbs(),
          grow: true,
          align: "start",
          justify: "start",
        },
        {
          Component: Component.Flex({
            components: [
              { Component: Component.Darkmode() },
              { Component: Component.ReaderMode() },
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
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
      ],
    }),
    Component.Explorer(),
  ],
  right: [],
}
