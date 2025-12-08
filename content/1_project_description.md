---
title: Project Overview
summary: Overview of the Funiki Project
draft: false
permalink: /project-description
tags:
  - funiki
  - research
  - audio-visual
---

Funiki is a Sony CSL research project exploring how physical spaces can become responsive "stages" that blend light and sound to support activities ranging from collaborative tabletop play to restorative solo moments. The engine keeps a virtual stage in sync with real devices so object-based audiovisual elements can layer, mix, and move with natural dynamics.

## Why it matters

- **Interpretive ambience** – instead of recreating literal scenes, Funiki
  prioritizes the emotional essence of a setting so people complete the
  experience with their imagination.
- **Everyday hardware** – lights aren't one-to-one with simulated candles or
  torches; the system maps object-based light sources to whatever fixtures are
  available, similar to how Dolby Atmos maps audio objects to speakers.
- **Non-technical creativity** – long term, the team wants anyone to define a
  vibe via multimodal prompts (text + image palettes) and let the engine render
  it in real time.

## Core challenges

1. **Interpretation vs. exposition** – ambiences must imply enough detail to be
   evocative without dictating the entire scene.
2. **Complex light + audio dynamics** – concert-lighting style effect modules
   fall short when you need realistic motion, layering, and synchronicity.
3. **Data scarcity** – there is no dataset of Funiki ambiences, so AI systems
   must be modular and schema-driven.

## Research questions

- What breadth and depth of object-based audiovisual experiences are possible?
- How can AI support the creation of those ambiences, both offline and in real
  time?

## AI workflow sketch

1. Construct a scene description + schema for ambient elements.
2. Generate metadata for each light/sound object and their dynamics (position,
   motion, intensity, synchronicity).
3. Generate or retrieve the actual audiovisual assets.
4. Compose everything into a coherent ambience that the Funiki engine can play.

Large Language Models are useful here as common-sense reasoners: they can infer
what belongs in, say, a Napoleonic battle ambience (cannon fire, shouted orders,
metal impacts) and provide structured guidance that downstream systems can turn
into synchronized light/sound events.

## Design takeaways

- Treat the engine as a **research-creation tool**: creative targets and engine
  capabilities co-evolve.
- Focus on **responsive spaces, not screens** – people inhabit the ambience
  rather than observe it.
- Iterate toward a **generalizable schema** so AI can reliably emit dynamic,
  object-based scenes for any room configuration.

Further reading: [Sony CSL – Funiki](https://csl.sony.fr/projects/funiki/).
