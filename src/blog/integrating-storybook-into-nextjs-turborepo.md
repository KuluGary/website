---
title: My first steps with Storybook
lang: en
date: 2025-08-23
tags:
  ["blog-post", "development", "web-dev", "storybook", "nextjs", "turborepo"]
description: For a long time I wanted to deepen my knowledge of Storybook, and thanks to a series of needs at work I finally had the chance.
---

At our startup, UI testing was minimal. This was fine during MVP, but as the platform grew in size and userbase, so did the need for increased maintainability. A few weeks ago I remembered this [talk by Kevin Yank](https://kevinyank.com/posts/help-storybook-is-eating-all-our-tests/) where he describes how Culture Amp uses Storybook for nearly every test case.

During this last holiday season, my project manager scheduled a couple of weeks to tackle technical debt, and one of the things I had to do was implement Storybook into our existing codebase.

## What is Storybook

You can think of Storybook as a sandbox where each component lives independently from each other. Instead of lauching a whole Next.js app to test some UI components, you can preview them and tweak them in isolation.

## Adding Storybook to a Turborepo

We chose Turborepo to manage our apps since we needed a shared ecosystem of components, hooks, API calls and providers. Turborepo gave us scalability with a `packages/ui` folder for shared UI elements and `packages/lib` for API configs, integrations and utils.

We set up Storybook as a new Turborepo app (`apps/storybook`) alongside our two main Next.js ones. This kept configurations isolated while letting us import from `packages` to build our Stories.

Our first Story was for the `Button` primitie component:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "@platform/ui/primitives/button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: Button.variantOptions,
      defaultValue: "primary",
    },
    size: {
      control: { type: "select" },
      options: Button.sizeOptions,
      defaultValue: "default",
    },
  },
  args: {
    variant: "primary",
    size: "default",
    children: "Button",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { variant: "primary", children: "Button" },
};
```

## Adding NextAuth support

Many of our components depend on user state, and without NextAuth they would break or show meaningless output. We solved this by setting up a custom session privder for Storybook:

```tsx
import { unauthenticatedSession } from "@storybook/mocks/session";
import { SessionContext, Session } from "next-auth/react";

export default function NextAuthDecorator({
  children,
  session,
}: PropsWithChildren<{ session?: Session }>) {
  const sessionData = session || unauthenticatedSession;

  return (
    <SessionContext.Provider
      value={‎{
        update: () => Promise.resolve(sessionData) as any,
        data: sessionData as any,
        status: "authenticated",
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
```

With this decorator, we can preview components from different user POVs. For example, our **PlanCard** shows different available actions for admins vs. users, so we can swap sessions instantly without creating a new test account for each user type.

```tsx
import NextAuthDecorator from "@storybook/decorators/NextAuthDecorator";
import { sessionOptions } from "@storybook/mocks/session";
import AddServiceButton from "@platform/ui/components/projects/business-add-service/AddServiceButton";

export default {
  title: "Components/Project/Creation/Services/AddServiceButton",
  component: AddServiceButton,
  argTypes: {
    session: {
      control: { type: "select" },
      options: Object.keys(sessionOptions),
      mapping: sessionOptions,
    },
  },
};

export const Default = (args: { session?: keyof typeof sessionOptions }) => {
  return (
    <NextAuthDecorator session={args.session}>
      <AddServiceButton />
    </NextAuthDecorator>
  );
};
```

## Adding add-ons to Storybook

Once the technical setup was done, I focused back on what I wanted to achieve in the first place: easier design collacoration and testing business logic in isolation.

### Design collaboration

Using the `@storybook/addon-designs`, we can link and display Figma files directly inside Storybook. Our designers can now review UI compliance from a single interface:

```tsx
export const Playground: Story = {
  args: { variant: "primary", children: "Button" },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/design/...",
    },
  },
};
```

### Data & API simulation

Many of our components depend on backend data. In Storybook, pointing to live APIs is brittle and slow and takes away control over the data we want to perform our tests with. Instead, we:

- **Provide React Query context** with a global `QueryClientProvider`.

  ```tsx
  // preview.tsx
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  export const decorators = [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ];
  ```

- **Mock backend calls** using Mock Service Worker (MSW).

```tsx
// mocks/authHandlers.ts
import { HttpResponse, http } from "msw";
import { unauthenticatedSession } from "@storybook/mocks/session";

export const authHandlers = [
  http.get("/api/auth/session", () => {
    return HttpResponse.json(unauthenticatedSession, { status: 200 });
  }),
];
```

Then, enable it globally in `preview.tsx`:

```tsx
import { initialize, mswLoader } from "msw-storybook-addon";
import { authHandlers } from "../src/mocks/handlers/authHandlers";

initialize();

export const parameters = {
  msw: {
    handlers: [...authHandlers],
  },
};

export const loaders = [mswLoader];
```

This let us simulate responses (e.g., logged-in user vs. error state) and test components without touching real APIs.

## Adding internationalization

Our app relies heavily on `next-intl`. Without i18n, Storybook would render keys like `auth.login.button` instead of translated text. The fix was to reuse the same 18n provider we use on our apps inside Storybook:

```tsx
import LocaleProvider from "@platform/lib/client-only/providers/locale-provider.storybook";

const preview: Preview = {
  decorators: [
    (Story) => (
      <LocaleProvider locale="es">
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      </LocaleProvider>
    ),
  ],
};
```

Now components display actual strings ("Iniciar sesión" / "Login"), making design reviews realistic.

## Next steps

Storybook began as a way to preview components in isolation, but it’s quickly becoming our UI hub. Next up:

1. **Interaction testing** – script user flows (e.g., form validation) with Storybook’s testing utilities.
2. **Accessibility checks** – add `@storybook/addon-a11y` to catch accessibility issues early.
3. **Living documentation** – use `@storybook/addon-docs` to make stories double as dev & design docs.

Even though the team has shifted to other features, Storybook is now part of my daily workflow. I prototype in Storybook first, which makes development smoother, reviews clearer, and collaboration more inclusive.

---

If you’re working in a startup or small team, Storybook can be a game-changer. Instead of juggling staging builds, backend mocks, and screenshots, you get a single space where components come to life.

Try setting up a single component in Storybook this week and you'll see the benefits immediately.
