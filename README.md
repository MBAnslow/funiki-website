# Funiki Website

Funiki is an Obsidian-first knowledge garden powered by
[Quartz 4](https://quartz.jzhao.xyz/). Notes live inside `content/` and are
published automatically to GitHub Pages via Quartz + Bun. This README now collects
all of the workflow guidance so the published site can stay focused on actual
project notes.

## Garden overview

Funiki doubles as an Obsidian workspace for experiments, prototyping ideas, and
lightweight documentation that stays in sync with GitHub Pages.

### Structure

- Notes live in the `content/` directory and can be opened directly as an
  Obsidian vault. Everything is plain Markdown.
- Quartz renders backlinks, the graph, and friendly previews automatically when
  you run `bun dev` or publish via GitHub Actions.
- Start with `content/funiki.md` for the distilled Sony CSL research context, then
  branch into more focused notes as the garden grows.

### First steps

1. Open the `content/` folder in Obsidian (`Vault → Open folder as vault`).
2. Start a note anywhere in the tree and link it with `[[wiki-style links]]`.
3. When you're happy with the changes, `git add content/`, commit, and push.

> [!tip]
> Use frontmatter fields such as `title`, `permalink`, `tags`, and `draft: true`
> to control how Quartz exposes each note.

## Requirements

- [Bun](https://bun.sh/) `>= 1.3` (install with `curl -fsSL https://bun.sh/install | bash`)
- Node.js `>= 22`

Make sure the Bun binary (`$HOME/.bun/bin`) is on your `PATH`. Add the snippet
below to `~/.zshrc` or `~/.bashrc` if needed:

```sh
export BUN_INSTALL=$HOME/.bun
export PATH="$BUN_INSTALL/bin:$PATH"
```

## Project layout

| Path       | Purpose                                             |
| ---------- | --------------------------------------------------- |
| `content/` | Markdown notes opened directly as an Obsidian vault |
| `quartz.*` | Quartz configuration + layout overrides             |
| `quartz/`  | Quartz core (no need to edit unless customizing)    |
| `.github/` | GitHub Actions workflows                            |

## Local development

```sh
bun install            # once, installs deps based on bun.lock
bun dev                # serve site with live reload on port 8080
```

Quartz watches the `content/` directory. Open it as a vault in Obsidian
(`Vault → Open folder as vault`) and edit notes as usual; the dev server will
pick up changes immediately. Stop the server with `Ctrl+C`.

## Working with Obsidian

Quartz works best when the entire `content/` directory is opened directly as a
vault so backlinks, outgoing links, and the graph render exactly like they do on
the published site.

### Recommended settings

- **Files & Links → New link format**: `Absolute path in vault`
- **Files & Links → Automatically update internal links**: `On`
- **Files & Links → Detect all file extensions**: `On`
- **Core plugins**: Backlinks, Graph view, and Outgoing links mirror what Quartz
  exposes in the sidebar.

> [!warning]
> Avoid storing the `.obsidian/` folder inside `content/`. Quartz ignores it, but
> keeping the config outside the repo (or explicitly ignored) keeps commits tidy.

### Publishing from Obsidian

1. Write or update notes inside the vault with regular Markdown and `[[wikilinks]]`.
2. Run `bun dev` to preview the rendered site at `http://localhost:8080`.
3. Commit and push when you're ready; the Pages workflow will publish
   automatically.

For a fully in-editor experience, install the community
[Quartz Syncer](https://github.com/jackyzha0/quartz-syncer) plugin and point it
at this repository.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which:

1. Checks out the repo and installs Bun.
2. Installs dependencies with `bun install --frozen-lockfile`.
3. Builds the static site via `bun run quartz build`.
4. Publishes the generated `public/` folder to GitHub Pages.

Once the workflow finishes, the site is live at
`https://mbanslow.github.io/funiki-website`. You can also trigger the workflow
manually from the Actions tab if you need to redeploy without new commits.

## Daily workflow

1. Write notes in Obsidian (or edit Markdown directly) inside `content/`.
2. Preview locally with `bun dev`.
3. Commit your changes: `git add content/ quartz.config.ts` etc.
4. Push to `main` — deployment happens automatically.

Happy gardening! 🌱
