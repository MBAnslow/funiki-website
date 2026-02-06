---
title: Why it matters?
summary: The Funiki project has touches upon many different creative and technological problems. Here we summarise why we think it's an interesting and relevant project.
draft: false
permalink: /our-philosophy
tags:
  - funiki
  - research
  - philosophy
weight: 3
---

# Society

## Lack of Presence

We live in a time of screens. We swipe, scroll, and consume. Even when the content is beautiful or well-crafted, we remain on the outside, staring in. Stories happen elsewhere, over there, on a wall or a device while we sit still. Even when we are together, we don’t face each other.

This is content that we don’t shape and where we don’t fundamentally matter. The result is a quiet kind of isolation, disconnection, lack of presence and a confused headspace, making it difficult to process what is going on in our lives because we consume without participation.

Without presence and participation, our personality withers, lost in a sea of other people’s stories, people that we don’t know and will likely never meet.

## How can we Reconnect?

What kinds of activities might pull us away from our screens?

_Moments of solitude. Moments of contemplation. Moments where our mind drifts away. Moments where we are present. Moments of play. Moments we share with others._

All these moments happen on a stage – the space we co-exist with. However, while our mind moves, our space remains static. A space with a single static design.

## Entertainment with Presence

Screen-based experiences are a view into another world. They draw people away from participating and being present in their physical and social environment. Funiki isn't just something you look at, it's something you are a part of. It illuminates you and your activites. We hope that Funiki encourages people to get back into their spaces, into relationships where they have presence and significance.

---

# Creation

## It’s Not a Screen

Funiki differs from screen-based experiences. Rather than directing attention, it supports activities that are the focus of attention. The experience is **spatial and embodied**, not contained or framed. You inhabit the ambience rather than observe it. While screens are portals to another place, Funiki brings ambience to your space. It illuminates an activity.

## Literal > Suggestive

What we are trying to do is **suggest** that events are taking place. That requires a level of physicality that is not typical with simple mood or abstract lighting. Take a flaming arrow as an example. Where is the arrow coming from? How bright is it? Where is it directed? The lighting has directionality and volume that indicates that events are taking place which is enhanced by sound cues.

## Diverse spaces, diverse hardware

While screen and audio quality absolutely affects enjoyment of conventional media, even the most modest equipment imparts the literal intention of the creator. A cat is a cat, a person is a person.

With Funiki, scene are transferrable across different spaces and hardware. This potentially changes the experience. Not just the fidelity of the experience, but also comprehension of the events taking place. This offers an interesting creative challenge.

## Personal and public spaces become venues

The basic technology changes what are otherwise static spaces into a dynamic stage to support various activities. While screens do this to some extent, such as hosting a movie night, watching a screen is a passive experience, while our focus is on supporting activities. What sorts of social activities might emerge from this new appropriation of public spaces?

---

# Technology

While surround sound is an established technology, surround lighting doesn't particularly seem to exist in the same way. Nor does the pairing between surround sound and lighting in a systematic or standardised way. That is the technical space that Funiki engages with.

## Beyond Screen-Reactive Lighting

Screen-reactive lighting (e.g. ambilight) extends screens to lights surrounding the screen based on pixel values. This is a literal mapping from pixel values to lights. While this adds entertainment, it doesn't add information that isn't there in the display already.

To provide surround lighting, you would need to represent the lighting conditions **within** the imagined or real space of the media. In other words, what would be around me if I were in the real or imagined place?

While Funiki is primarily focused on purely ambient experiences, the basic technology could be used to augment screen based viewing by providing surround lighting. This is both a creative problem (as is creating a surround sound experience) but also a technological challenge related to finding reasonable encoding/decoding approaches.

## AI Research

Funiki presents a challenging and unconventional multi-modal domain. While many of the components of the system already exist: generating foleys, generating scenes in computer graphics, key-frame animation, inverse rendering etc. the specific application domain is novel and motivates new problems.

### Systematising Ambiences

One way of creating an ambience is to start with a complete scene and gradually reduce it to its essential qualities. Pixel art offers a useful analogy: beginning with a high-resolution image, reducing the resolution forces us to be selective about which features are preserved. This process is not trivial—naive statistical reductions often strip away the scene’s emotional and semantic richness. Capturing ambience requires intentional simplification: identifying meaningful elements, abstracting them thoughtfully, and reassembling them into a stylized yet coherent whole. Like pixel artists, creators of ambience must navigate the tension between minimalism and expressiveness.

While there are many resources in computer vision for generating images and video and methods for estimating lighting in computer graphics conveying this as an ambience that _feels right_ in a physical space is its own problem. The problem itself needs to be better understood and defined before building from existing solutions.

###

It motivates generation of paired sounds and lighting which I don't believe exists elsewhere. Moreover, the focus is on supporting creators, not generating complete final mixes, but controllable elements that can be controlled by creators.

### Paired Audio & Light Generation

Some sources of light are a product of events that also generate sounds. Fireworks, gun fire, fireplaces, flickering neon lights, magic spells etc. As both signals reflect a singular event with dynamics that we are familar with as human beings, getting the sychronisation between the two modalities right adds physical plausibility to the events. Recent advances in paired video and sound generation opens the door to methods for open-ended sound + light generation.
