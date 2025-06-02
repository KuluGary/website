---
title: How I deploy to Neocities
date: 2024-11-14
tags: ["blog-post", "development", "web-dev", "site-development"]
description: Part of my workflow when writing to this site is building the static files and uploading them to Neocities, so I made a sh script to automate it.
---

This personal site is hosted in [Neocities](https://neocities.org/) and built using [11ty](https://www.11ty.dev/). To simplify uploading my static files to Neocities, I wrote a very small shell script that I added to my `package.json`.

```sh
#! /bin/bash
rm -rf _site
npm run build
git add .
git commit -m "Updated: `date +'%Y-%m-%d %H:%M:%S'`"
neocities push _site
```

A brief explanation of what this script does:

- Deletes the previous `_site` folder, where the static files live, to re-generate it.
- Runs `npm run build`, which is the same as `npx @11ty/eleventy`.
- Stages all changed files for git, and makes a commit with a message in the format "Updated: 2024-11-12 22:17:05"
- Uses [Neocities CLI](https://neocities.org/cli) to upload the static files to Neocities.

It's very simple, but if anyone has a similar work pipeline I hope it helps.
