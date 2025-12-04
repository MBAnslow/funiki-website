import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Funiki",
    pageTitleSuffix: "Project Website",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    baseUrl: "https://mbanslow.github.io/funiki-website",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: { name: "Abril Fatface", weights: [400] },
        body: "Source Code Pro",
        code: "IBM Plex Mono",
        toc: { name: "Bad Script", weights: [200] },
        date: { name: "Bad Script", weights: [200] },
      },
      colors: {
        lightMode: {
          light: "rgba(250, 248, 248, 1)",
          lightgray: "rgba(229, 229, 229, 1)",
          gray: "rgba(184, 184, 184, 1)",
          darkgray: "rgba(78, 78, 78, 1)",
          dark: "rgba(43, 43, 43, 1)",
          secondary: "rgba(40, 75, 99, 1)",
          tertiary: "rgba(132, 165, 157, 1)",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "rgba(255, 242, 54, 0.53)",
          tableHeader: "rgba(143, 159, 169, 0.15)",
          tableBody: "rgba(250, 248, 248, 0.6)",
        },
        darkMode: {
          light: "rgba(22, 22, 24, 1)",
          lightgray: "rgba(40, 40, 40, 1)",
          gray: "rgb(108, 72, 48)",
          darkgray: "rgba(212, 212, 212, 1)",
          dark: "rgba(235, 235, 236, 1)",
          secondary: "rgba(250, 160, 70, 1)",
          tertiary: "rgba(242, 119, 32, 0.81)",
          highlight: "rgba(210, 80, 1, 0.15)",
          textHighlight: "rgba(179, 170, 2, 0.53)",
          tableHeader: "rgba(222, 147, 73, 0.78)",
          tableBody: "rgba(84, 79, 70, 0.2)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
