---
title: Lighthouse
permalink: /the-lighthouse/lighthouse
summary: How we created the taxi scene.
tags:
  - funiki
  - lightouse
  - light
  - demo
publishDate: 10/02/2026
weight: 2
headerImage: ./static/the-lighthouse/lighthouse-header.png
headerImageAlt: Lighthouse shining in the night across the sea.
---

## The Story

> _They stood before the lighthouse, its towering silhouette carved against the night sky. The great lantern above revolved with patient inevitability, and every few seconds its beam swept across the rocks, the grass, and finally over them. Each pass was different. One moment they were swallowed in deep coastal blue, shapes barely distinguishable; the next, they were caught in a hard white arc of light, shadows thrown long and sharp behind them. The sea answered with a distant, rhythmic crash, and the wind carried salt and the faint metallic groan of the turning mechanism high above. In those brief illuminations, their figures seemed frozen, travelers paused on the threshold, before darkness folded back in._
>
> _They approached the heavy wooden door and knocked, the sound dull and resonant against the stone. For a heartbeat, nothing answered but the wind. Then a warm seam of light appeared along the edges of the door, thin at first, then widening as it slowly creaked inward. The golden interior glow spilled out across the ground and over their faces, softening the harsh lines left by the rotating beacon. For a moment the two lights overlapped, the cold, sweeping brilliance of the lighthouse beam crossing the steady amber from within, bathing them in shifting layers of white and gold. Hinges groaned. The sea roared again. And as the door opened fully, the boundary between the vast, indifferent night and whatever waited inside began to dissolve._

# Lighting Effects

There are lights distributed around the central sphere as well as a single light above the sphere. The light above is white, representing moonlight, while the other lights are a dark blue, representing the night. A keyframe animation changes the lights to white periodically, using staggered start times so that the light feels like it moves across the space like a beam of light. Guillaume chose an abstract sound to represent this beam shining on people to give it its own sort of personality and also to hint at something mysterious about the lighthouse.

In the following video we show a video of the effect from our second demo. The light tethering graph is not identical to the one used in the demo but the keyframe animations are the same. We've grouped the outputs to the left (the signals sent to the lights) and the inputs to the right (views on the central sphere) from upper to lower and from left to right so you can see how the spatial effect propogates across the scene. 

<VideoCard
  title="Lighthouse Light and Door Opening."
  desc="The lighthouse lights passes by periodically until partipants knock on the door and the door creaks open, illuminating them. I've kept the light outputs grouped on the left and the inputs grouped on the right. The nodes are spatially arranged from upper to lower and left to right to make it clear what the spatial effects are."
  src="https://drive.google.com/file/d/1lJlm7FLotH5myG4u1Efm3aoVnlsJEBA9/preview"
/>
