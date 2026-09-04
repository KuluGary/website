---
title: Summer 2026
date: 2026-07-03
tags: ["personal"]
description: What I've been up to these past few months.
lightbox: true
draft: true
---

This summer's been rough, huh?

Here in Europe we've beaten every major record related to heat in recorded history. If you've kept up with the news, we've been having heatwaves consecutively all summer.

Even though it's been hard, I've tried to keep active and work on stuff behind the scenes.

## Website redesign

I've had the itch to redesign this site for a while now. I think my first iterations go back to late last year, but until now I had not landed on an idea that I was content with.

{% gallery category, page.fileSlug %}
screenshot-1.png | First iteration of this website
screenshot-2.png | Second iteration of this website
{% endgallery %}

In the end I went for something more minimalistic. I used [Hyperblam's docs](https://hyperblam.how/) and [Toby Fox's website](https://toby.fangamer.com/) for inspiration.

## Personal media tracker

I've written a few articles about my [media tracker](/blog/i-populated-my-site-with-media/) in the past, but since then I reworked it to become a CLI tool that is completely configurable and can synchronize specific sources. For example:

`tracker sync youtube playlist-items --playlist "$YOUTUBE_PLAYLIST_ID"`

With this I can self-host it easier and also share it with family and friends who want to use it.

## Game development

This summer I suddenly had more free time, so I started to prototype a new game.

Ever since I was a teenager and learned to make small games, I wanted to make an RPG. My first engine ever was RPG Maker XP, and I used to share a few cobbled-together demos in obscure gaming forums that no longer exist. Even though later in life I tried to make games in other genres such as platformers or point-and-click adventures, in my heart I still wanted to make an RPG.

This past June I started prototyping the bases of a JRPG system in Godot. I'm using the mono build, so for now it's written exclusively in C#.