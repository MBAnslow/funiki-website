---
title: Quartz Callout Examples
summary: Quick reference for every built-in callout style supported by Quartz’s Obsidian-flavored Markdown parser.
draft: false
tags:
  - feature
  - transformer
---

Quartz inherits Obsidian’s callout syntax, so any of the built-in types (plus custom aliases) work out of the box. The pattern is:

```
> [!type] Optional Title
> Optional supporting copy…
```

Below is a live preview of the main callouts taken from the [Quartz feature guide](https://quartz.jzhao.xyz/features/callouts).

> [!note] Note
> Aliases: `note`

> [!abstract] Abstract
> Aliases: `abstract`, `summary`, `tldr`

> [!info] Info
> Aliases: `info`

> [!todo] Todo
> Aliases: `todo`

> [!tip] Tip
> Aliases: `tip`, `hint`, `important`

> [!success] Success
> Aliases: `success`, `check`, `done`

> [!question] Question
> Aliases: `question`, `help`, `faq`

> [!warning] Warning
> Aliases: `warning`, `attention`, `caution`

> [!failure] Failure
> Aliases: `failure`, `missing`, `fail`

> [!danger] Danger
> Aliases: `danger`, `error`

> [!bug] Bug
> Aliases: `bug`

> [!example] Example
> Aliases: `example`

> [!quote] Quote
> Aliases: `quote`, `cite`

> [!info] Nested callouts?
>
> > [!tip] Yes!
> > Callouts can nest and even be collapsible (use `> [!note]-` to start collapsed).
