---
title: "Learning p5.js week two: Marching Squares"
lang: en
date: 2025-10-11
tags:
  - blog-post
  - development
  - p5js
  - learning
  - learning-p5js
  - creative-coding
description: "Week two of p5.js experiments: implementing the marching squares algorithm in JavaScript to generate procedural worlds from simple values."
---

This week's experiment dives into the **marching squares** algorithm, following [this video](https://www.youtube.com/watch?v=0ZONMNUKTfU) from [The Coding Train](https://thecodingtrain.com/).

## What are Marching Squares

According to [Wikipedia](https://en.wikipedia.org/wiki/Marching_squares):

> [...] an [algorithm](https://en.wikipedia.org/wiki/Algorithm "Algorithm") that generates [contours](https://en.wikipedia.org/wiki/Contour_lines "Contour lines") for a two-dimensional [scalar field](https://en.wikipedia.org/wiki/Scalar_field "Scalar field") (rectangular [array](https://en.wikipedia.org/wiki/Array_data_structure "Array data structure") of individual numerical values)

In simpler terms, it’s a way to turn a field of numbers into shapes.
Its 3D cousin, [marching cubes](https://en.wikipedia.org/wiki/Marching_cubes), is often used in [game development](/blog/tags/game-dev) to build procedural worlds — think [Minecraft](https://www.minecraft.net) or [Terraria](https://terraria.org).

If you're curious about how that looks in practice, [Sebastian Lague’s video](https://www.youtube.com/watch?v=M3iI2l0ltbE) is a great deep dive into generating landscapes on the fly.

## Notes

The script builds a grid of cells across the canvas like a chessboard, and assigns each corner a value based on a noise function.

Each square is then evaluated: depending on which corners are above or below a threshold, a contour line is drawn through it. The result is a fluid, organic network of lines that seem to outline invisible terrain.

It's a surprisingly compact algorithm for what it does. With just a few loops and a bit of logic, a world starts to take shape from numbers alone.

## Final result

<iframe src="https://editor.p5js.org/KuluGary/full/zzYneA4wT" height="350px"></iframe>

## References

- [Coding Marching Squares](https://www.youtube.com/watch?v=0ZONMNUKTfU) by [The Coding Train](https://thecodingtrain.com/).
- [open-simplex-noise-js](https://github.com/joshforisha/open-simplex-noise-js) by [Josh Forisha](https://github.com/joshforisha).

## How It Works

Each frame begins with a grid of noise values, generated using OpenSimplex noise. These values act like a topographic map: higher numbers mean "solid ground", lower ones mean "empty space".

The marching squares algorithm checks every cell in that grid and compares them to a threshold. Depending on which corners are above or below that threshold, the cell is assigned one of sixteen possible configurations. Each configuration defines how the contour line should pass through it.

The program then connects these line segments across the grid, forming smooth boundaries that outline the noise field.
The result is a shifting pattern that feels like terrain depending on how the parameters are tuned.

Because the grid regenerates every frame, the shapes flow and evolve in real time, making the sketch feel less like static geometry and more like a moving landscape drawn by the code itself.

## Outro

Another week down and this one feels like a small step toward procedural generation.

There's something satisfying about watching a blank canvas slowly fill with shape and structure, as if the algorithm itself is discovering the terrain one line at a time.
