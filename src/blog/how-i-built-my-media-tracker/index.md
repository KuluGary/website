---
title: How I built my media tracker
date: 2026-02-22
tags: ["web-dev", "media"]
description: In order to manage all the media I interact with, I created a managed system which tracks and stores the information in an external database that I can later consume in any of my applications.
---

Ever since I created this website, I’ve kept a few pages dedicated to tracking the media I consume. At first it was simple: a few handcrafted JSON files, manually updated, rendered through Eleventy.

<aside style="--span:4">

The project’s full source code lives in its [GitHub repository](https://github.com/KuluGary/personal-media-tracker). If anything sparks questions, [feel free to reach out](/contact).

</aside>

Last year [I wrote about wiring the site directly to third-party APIs](/blog/i-populated-my-site-with-media) so builds would fetch fresh data automatically. It worked and the site became self-updating but over time, it also became fragile.

This post is about extracting that logic into a small tracking service with its own architecture, its own persistence layer, and clearer boundaries.

## The Problem With the Initial Approach


The previous system had two structural weaknesses.

1. **Everything lived inside the website**. All fetching logic was embedded in the static site project. That meant:
    - Deploying the site triggered full data synchronization.
    - The tracker couldn’t exist independently.
    - Reuse in another application would require extraction anyway.

2. **There was no persistence**. Every build re-fetched everything. If an API failed or returned malformed data, the broken result became the new truth immediately. There was no memory of previous state or protection against transient failures. That approach scales poorly once the data becomes meaningful.

At some point the solution stopped being incremental fixes and became structural:

1. Separate the tracker from the site.
2. Give it a domain model.
3. Persist the data properly.

With this, obtaining and storing the data would be a system instead of a build step.

## The Stack

I stayed in the JavaScript ecosystem. Node.js with TypeScript keeps the feedback loop short and lets me model things with type safety.

For persistence, I chose Supabase. It provides managed Postgres without infrastructure overhead. I briefly considered self-hosting, but this project was about modeling, not DevOps experimentation.

<aside style="--span:3">

I also experimented with [edge functions](https://supabase.com/docs/guides/functions) to retrieve data through a [cron job](https://supabase.com/docs/guides/cron), but I finally chose a self-managed system over it.

</aside>

## What the Tracker Does

At a high level, the tracker now fetches from external APIs → normalizes their responses → persists structured entities into Postgres → stores structured and stable data to its consumers.

The website is now just one consumer and not the be-all-end-all of media syncronization. That shift alone simplified everything and .

## Architectural Shape


The system follows a layered flow:

```
External APIs
	↓
Clients
	↓
Normalizers
	↓
Domain services
	↓
Repositories
	↓
Postgres
```

<aside>

    In order to have a clean architecture I used a [domain drived design](https://en.wikipedia.org/wiki/Domain-driven_design) approach. I'm not super familiar with it, but it's something I've been meaning to delve into since a few months back and this worked as a reasonable excuse to try.

</aside>

Each layer has a narrow responsibility.

- Clients talk to external systems.
- Normalizers translate foreign data into internal language.
- Domain services coordinate behavior.
- Repositories persist.
- Postgres stores durable state.

This separation makes the system extensible. Adding a new API does not ripple through presentation logic.

## Modeling the Domain

Previously, media items were loose objects shaped by whatever API produced them.

Now they are explicit entities. The core concepts are:

- **Entities**: trackable items such as games or books.
- **Source identities**: mappings between external IDs and internal entities.
- **Relationships**: structural links between entities.
- **Metadata**: descriptive data from external sources.
- **Trackable state**: progress or completion status.
- **Time state**: accumulated time spent.

These abstractions make composition possible. A game can have achievements. A show can have seasons and episodes. A book can contain chapters.

Instead of encoding these hierarchies directly in schema tables, the system expresses them through relationships between entities.

## A Concrete Example: RetroAchievements

Currently the tracker supports games through RetroAchievements and Steam. Let’s walk through RetroAchievements as a vertical slice.

<aside style="--span:3">

  [RetroAchievements](https://retroachievements.org/) is a community-driven system to earn achievements in classic games. In this way, you can keep track of stuff like play time and completion percentage while retro gaming.

</aside>

### Fetching Data

The client layer is intentionally straightforward:

```ts#6 title="RetroachievementsClient.ts"
async fetchGameProgress(): Promise<RetroachievementsGameProgress[]> {
  const url = "https://retroachievements.org/API/API_GetUserCompletionProgress.php";

  const params = new URLSearchParams({
    u: this.userId,
    y: this.apiKey,
  });

  const res = await fetch(`${url}?${params}`);

  if (!res.ok)
    throw new Error(`Retroachievements API Error: ${res.status}`);

  const json = (await res.json()) as RetroachievementsGameProgressResponse;

  return json.Results ?? [];
}

async fetchAchievementsBetween(startDate?: string, endDate?: string): Promise<RetroachievementsAchievement[]> {
  const url = "https://retroachievements.org/API/API_GetAchievementsEarnedBetween.php";

  const params = new URLSearchParams({
    u: this.userId,
    y: this.apiKey,
  });

  if (startDate)
    params.append("f", startDate);

  if (endDate)
    params.append("t", endDate);

  const res = await fetch(`${url}?${params}`);

  if (!res.ok)
    throw new Error(`Retroachievements API Error: ${res.status}`);

  const json = (await res.json()) as RetroachievementsAchievement[];

  return json ?? [];
}
```

<aside class="bottom">

Achievement fetches are incremental. Instead of pulling all records every time, the tracker requests entries since the last successful sync. Unlocks tend to happen in bursts, so incremental sync reduces redundant processing.

</aside>

As seen here, a single client can retrieve multiple entities which often share a relationship.

### Normalization

External APIs rarely agree on structure or vocabulary. Before persistence, responses are translated into a consistent internal format:

```ts title="RetroachievementsNormalizer.ts"
normalizeGame(data: RetroachievementsGameProgress): RetroachievementsNormalizedGame {
    return {
      kind: "game",
      title: data.Title,

      source: "retroachievements",
      externalId: String(data.GameID),

      metadata: {
        platforms: [data.ConsoleName],
        gameId: data.GameID,
        consoleId: data.ConsoleID,
        achievementsUnlocked: data.NumAwarded,
        achievementsTotal: data.MaxPossible,
        lastPlayed: data.MostRecentAwardedDate,
      },
    };
  }
```

<aside class="bottom">

Metadata lives in a JSON column. TypeScript enforces compile-time safety while Postgres provides storage flexibility.

</aside>

The tracker owns the language and the external systems adapt to it, instead of the other way around as previously implemented.

### Persistence and Relationships

Saving an entity is not a single insert. It is a sequence:

1. Get or create the entity,
2. Attach a source identity,
3. Upsert metadata,
4. Establish relationships.

Achievements become child entities of games:

```ts#100 title="RetroachievementsSync.ts"
await this.relationships.createRelationship({
  parentId: gameEntityId,
  childId: achievementEntityId,
  type: "HAS_ACHIEVEMENT",
  parentKind: "game",
  childKind: "achievement",
});
```

The same mechanism can represent:

- Season to show relationships
- Chapter to book structures
- Track to album hierarchies

The domain model stays generic and composition handles how the data is populated.

### The Website’s Role Now

The website no longer communicates with external APIs. Instead it queries Supabase directly:

```js#10 title="data/games.js"
const { data, error } = await supabase
  .from("entities")
  .select("*")
  .eq("kind", "game");
```

The data may be reshaped for presentation, but correctness lives elsewhere.

## Why This Matters

This is undeniably more complex than a JSON file inside a static site, but it gives me:

- Stable persistence.
- Clear ownership of data.
- Extensibility without rewrites.
- The freedom to build additional consumers later.

More importantly, it became a consumer-agnostic system I can repurpose in the future to be used by friends and family, have backups, and connect with new APIs more easily.

## Next steps

The way this system is set-up makes including new third-party providers and data types trivial. In the near future I can add more than videogames, such as integrations with music providers, book trackers, video on-demand platforms, etc.

I hope this overview has been interesting, if not useful. Remember that you can read the full source code at its [GitHub repository](https://github.com/KuluGary/personal-media-tracker).