---
title: The System
summary: A broad description of the Funiki system.
draft: false
permalink: /project-system
tags:
  - funiki
  - research
  - system
weight: 4
---

## Simulating Lights & Sounds

We use Godot as our game engine. Godot is a free, open-source game engine for building 2D and 3D interactive applications such as games, simulations, and visualisations, offering a unified editor, modern real-time rendering, and cross-platform deployment. It has a scene and node based design composing complex behaviour small, reusable components encouraging modular and system-level thinking.

## Object-based Surround Sound & Lighting

The Funiki project focuses on creating dynamic ambiences. These ambiences are composed of a mixture of audio-visual objects that layer and mix together in a virtual scene that is mapped to whatever lights and speakers are available in your physical space.

This mapping is not one-to-one. A single light bulb does not represent a single light source such as a candle. Instead, physical lights capture the general lighting conditions within the virtual scene. A large virtual fireplace might ripple and flux across multiple physical lights given the impression of volume. While the position of a fairy flying through the virtual scene will be implied in the physical space by dynamically changing light intensities. This can be thought of as the 'surround lighting' as the analog to 'surround sound'.

## Global Illumination

While light objects capture localised lighting information from specific objects, there are cases where we want a general backdrop against which these events are taking place. That is where global illumination maps come in. Think of it like a 360 degree map of light coming in from all directions that serves as a background.

High Dynamic Range Imaging (HDRI) panoramas are one way of representing this information. They capturing light arriving from any direction from a single point (our viewing point). Light from light objects mix with this background illumination (and eachother).

## Light Synthesizer

Alongside simulating lighting conditions, Funiki also includes a software 'light synthesizer'. This synth specifies a pathway from a light emitter to physical light bulbs with effects that modulate light inbetween.

While some ambiences require simulating complex lighting interactions, in other cases, predefining particular lights and altering them by composing together effects (pulsing, flickering, strobe etc) might be the best creative solution. The synth can 'mix' user-defined colour, sample from the simulation or some combination of the two, providing the best of both worlds.

## AI Workflow Sketch

The construction of ambiences using AI roughly falls into the following tasks:

- Constructing a scene and identifying ambient elements
- Generating meta data for audio-visual objects and their dynamics
- Generating / retrieving audiovisual objects
- Composing the scene into a coherent whole

### Multi-modal aspects

The project lies at the intersection of various areas of AI.

**Large Language Models** are useful as a common-sense reasoner: they can infer what belongs in, say, a Napoleonic battle ambience (cannon fire, shouted orders, metal impacts) and provide structured guidance that downstream systems can turn into synchronized light/sound events.

**Image and video** models undertand visual and audio details that a LLM would not. What a flash of lightening looks like in terms of changing light intensity and how the sound of lightening varies with these flashes.

**Audio** for generating audio tracks that correspond to events and mixing individual sound sources into a coherent ambient soundscape.

**Computer Vision & Gaming** for constructing/reconstructing lighting conditions and their dynamics in the context of a game engine i.e. as key-frame instructions.
