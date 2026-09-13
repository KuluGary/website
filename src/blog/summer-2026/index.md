---
title: "Summer 2026"
date: "2026-09-12"
draft: true
lightbox: true
description:
tags: personal
---

This summer’s been rough, huh?

In Europe we’ve had one of the hottest seasons in recorded history. Maybe you’ve heard or read about it in the news. I hope the coming months are a little gentler with all of us.

Even though it’s been tough, I’ve tried to keep working on stuff all the same.

## Website redesign

I’ve had the itch to rework my personal site for a while now. I think my first prototypes go back to late last year, but I didn’t find something I was content with until now.

{% gallery category, postSlug %}
screenshot-2.png | First iteration of this website
screenshot-1.png | Second iteration of this website
{% endgallery %}

In the end I went for something a little minimalistic. I used [Hyperblam's docs](https://hyperblam.how/) and [Toby Fox's website](https://toby.fangamer.com/) for inspiration.

## Personal media tracker

I've written a few articles about my [media tracker](/blog/i-populated-my-site-with-media/) in the past, but since then I reworked it to become a CLI tool that is completely configurable and can synchronize specific sources. For example:

`tracker sync youtube playlist-items --playlist "$YOUTUBE_PLAYLIST_ID"`

With this I can self-host it easier and also share it with family and friends who want to use it.

## Game development