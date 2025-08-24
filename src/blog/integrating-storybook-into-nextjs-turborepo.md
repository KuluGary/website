---
title: My First Steps with Storybook
lang: es
date: 2025-08-23
tags:
  ["blog-post", "development", "web-dev", "storybook", "nextjs", "turborepo"]
description: For a long time I wanted to deepen my knowledge of Storybook, and thanks to a series of needs at work I finally had the chance.
---

At our startup, UI testing was almost nonexistent. That worked fine during MVP, but as our platform grew, so did our need for maintainability. That’s when I remembered this [talk by Kevin Yank](https://kevinyank.com/posts/help-storybook-is-eating-all-our-tests/) where he recounts how they used Storybook at Culture Amp. for almost every test case.

Due to the holiday season, my Project Manager scheduled a couple of weeks to tackle technical debt, and I proceeded to spend a few days implementing Storybook.

## What is Storybook

Think of Storybook as a sandbox where each component lives independently. Instead of launching your entire Next.js app to test a button, you can preview and tweak it instantly in isolation.

## Implementing Storybook in a Turborepo

We chose Turborepo to manage our apps since they needed to share components, hooks, API calls and providers. Turborepo allowed for better scalability, where we have a `packages/ui` folder with shared components, as well as `packages/lib` for things like API configs, third-party integrations and utils.

We integrated Storybook into a new Turborepo application in `apps/storybook`, like our main Next.js apps. This way all of its configurations are isolated, and we can import our `packages` and create Stories for them.

Our first Story was for our `Button` primitive component.

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs";

import { Button } from "@platform/ui/primitives/button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
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
  args: {
    variant: "primary",
    children: "Button",
  },
};
```

## Integrating NextAuth

Many of our more complex components depend on user state. Without NextAuth, our stories would break or not display meaningful content. What we needes is to set up a new session provider specifically to manage user state while in the Storybook sandbox.

```tsx
import { unauthenticatedSession } from "@storybook/mocks/session";
import { SessionContext, Session } from "next-auth/react";

export type NextAuthSession = {
  expires: string;
  user: any;
};

export default function NextAuthDecorator({
  children,
  session,
}: PropsWithChildren<{
  session?: Session;
}>) {
  const defaultSessionData = unauthenticatedSession;

  const sessionData = session || defaultSessionData;

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

Now we can wrap any of our components in this decorator and thus create Stories for components that depend on the user session to display information.

For example, our PlanCard component only shows certain actions to admins. With mocked sessions, we can preview both the "admin" and "user" view instantly, without creating test accounts.

```tsx
import { adminSession } from "@storybook/mocks/session";
import NextAuthDecorator from "@storybook/decorators/NextAuthDecorator";

import { mockPlan } from "@platform/lib/universal/mocks/plan";
import PlanCard from "@platform/ui/components/plan/PlanCard";

export default {
  title: "Components/Plan/PlanCard",
};

export const Default = () => (
  <NextAuthDecorator session={adminSession}>
    <PlanCard
      plan={mockPlan}
      onEditPlan={() => alert("Edit Plan clicked")}
      onEditProfile={() => alert("Edit Profile clicked")}
    />
  </NextAuthDecorator>
);
```

Beyond simply displaying session-based components, this approach also lets us is being able to choose which session we’re viewing the component with.

This is very important, since it allows us to review the design of a component from different user POVs. In this way, we don't have to log in with different test accounts, we just need to use the mocked sessions.

```tsx
import { useState } from "react";

import NextAuthDecorator from "@storybook/decorators/NextAuthDecorator";
import { sessionOptions } from "@storybook/mocks/session";
import { FormProvider, useForm } from "react-hook-form";

import {
  BusinessProjectServiceType,
  BusinessProjectServiceTypesType,
} from "@platform/lib/types/business-project-service";
import { businessProjectEditingServiceMock } from "@platform/lib/universal/mocks/business-project-service";
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

const defaultValues = { projectId: "project-1" };

export const Default = (args: { session?: keyof typeof sessionOptions }) => {
  return (
    <NextAuthDecorator session={args.session}>
      <AddServiceButton />
    </NextAuthDecorator>
  );
};
```

## Adding add-ons to Storybook

Once the technical implementation was done, I went back to the original problems I wanted to fix: make collaboration with designers easier and allow business logic testing in an isolated environment.

### Design collaboration

Being able to build a bridge between Figma designs and our production applications was the main concern when tackling this implementation. Using the `@storybook/addon-designs` we now can link Figma and Storybook in a meaningful way, and our designer can make design reviews without having to leave a single interface.

```tsx
export const Playground: Story = {
  args: {
    variant: "primary",
    children: "Button",
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/design/...",
    },
  },
};
```

### Data & API simulation

One of the first roadblocks we hit was that many of our components depend on live backend data. For example, a "User Profile" card or a "Plan Details" component won’t render properly unless the API responds with a specific set of data.

That’s fine in production, but in Storybook it becomes a problem. We don't want to stress our backend just to preview a button in a testing environment; and even if we did, we want to be able to have complete control of our components while inside of Storybook.

The solution is twofold:

### Provide React Query context

Many of our components use` @tanstack/react-query` hooks like `useQuery` and `useMutation`. These hooks won’t work without a `QueryClientProvider`. So first, we added a global decorator in `storybook/preview.tsx` that wraps every story in a query client.

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

Now, hooks won’t crash when used inside Storybook and we can retrieve anything we set into the cache.

### Mock the actual backend calls

React Query is ready, but without responses it still won’t render anything useful. Instead of pointing Storybook at our real dev backend (which would be slow and brittle), we use Mock Service Worker (MSW).

MSW intercepts HTTP requests and lets us define fake responses. This means you can define a story where `/api/auth/session` returns a logged-in user, or another story where the same endpoint returns an error.

Here’s a minimal example:

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

## Adding internationalization

The next obstacle we hit was internationalization (i18n). Our app relies heavily on `next-intl` to support both English and Spanish. Without i18n support, instead of the correct button label we'd see the raw key `auth.login.button`.

The fix was straightforward: use the same i18n provider in Storybook that we already use in the app. That way, all translation JSON files are loaded, and Storybook renders real text instead of keys.

Here’s the setup we added to `preview.tsx`:

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

Now when we open Storybook components display real text ("Iniciar sesión" or "Login") instead of i18n keys, and the designer can confirm that long strings don't break layouts.

## Next steps

When I first set up Storybook, my goal was simple: preview components in isolation. But over time, it’s clear that Storybook can be so much more than a visual catalog. It can become the central hub for UI development, testing, and collaboration.

Here's what we foresee will be our next steps:

1. **Interaction testing**
   Storybook’s testing utilities (`userEvent`, `play` functions) let us script real user flows. For example, we can type into a form and verify validation errors without leaving Storybook.
   ```tsx
   export const WithConceptLengthError: Story = {
     render: () => <GenericServiceModal open={true} />,
     play: async ({ canvasElement }) => {
       const canvas = within(canvasElement);
       const input = await canvas.findByRole("textbox", { name: /concept/i });
       await userEvent.type(input, "A".repeat(71)); // triggers validation error
     },
   };
   ```
2. **Accessibility checks**
   Adding the `@storybook/addon-a11y` addon would surface accessibility issues (contrast, ARIA attributes, keyboard traps) as we build, instead of after launch.
3. **Living documentation**
   With `@storybook/addon-docs`, our stories can double as documentation for developers and designers. Instead of separate Confluence pages, the source of truth lives next to the code.

Storybook started as a helper tool for me as the lone frontend engineer, but it’s quickly turning into a shared space where devs, designers, and PMs can all collaborate without spinning up the whole app.

Even though my team has pivoted to other features, Storybook is now part of my daily workflow: I rarely build a component directly in the app — I prototype it in Storybook first. That single change has made development smoother, reviews clearer, and collaboration more inclusive.

---

If you’re working in a startup or small team like me, Storybook can be a game-changer. Instead of juggling staging builds, backend mocks, and screenshots, you get a single place where components come to life, independent of the rest of the app.

I hope this walkthrough gave you a head start and the confidence to integrate Storybook into your own projects. If our little four-person team can get this much value out of it, I’m pretty sure yours can too.
