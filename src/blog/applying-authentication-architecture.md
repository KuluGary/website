---
title: Applying authentication architecture
lang: en
date: 2025-09-13
tags: ["blog-post", "development", "web-dev", "react", "architecture"]
description: To scale user access permissions based on role and attribute, we implemented ABAC permissions into our front-end application.
---

Every app with authentication eventually needs to tackle authorization. In our case, once our product grew from a small experiment into a mid-sized application, it became clear we needed a proper model to keep users from doing things they shouldn't.

To make the idea more concrete, let's imagine a simple blog with multiple authors and readers. Here's how I explored different approaches.

## The naïve approach

When we built our MVP, we started with the obvious: inline role checks.

```js
function submitUserPostEdit(user) {
  if (user.roles.includes("admin") || user.roles.includes("editor")) {
    // submit the code to the back-end
  }
}
```

Or inside a component:

```jsx
<form>
	<textarea>
	{user.roles.includes("admin") || user.roles.includes("editor") && (
		<button id="edit-post-button" type="submit">
	)}
</form>
```

It's fast, easy, and it works. But the problem shows up later: these conditions are scattered through business logic and UI. When the app grows and a permission needs to change, you have to hunt down every conditional buried in the code.

So, the first improvement is evident: centralize the rules.

## Role-based access control

In the blog example, we can define a few concepts: subjects (users), roles, permissions, and actions. Role-based access control (RBAC) links them together: each user gets one or more roles, and each role comes with a set of permissions that decide which actions are allowed.

![Role-based access control diagram](/assets/images/blog/implementing-abac-permissions/01.png){.prefers-media}

Here's a minimal setup:

```js
const PERMISSIONS = {
  admin: ["create:post", "update:post", "view:post", "delete:post"],
  editor: ["update:post", "view:post"],
  reader: ["view:post"],
};
```

And a simple checker:

```js
export const hasPermission = (user, permission) => {
  return user.roles.some((role) => {
    PERMISSIONS[role].includes(permission);
  });
};
```

Which we can use like this:

```js
// User should be like { id: "a", roles: ["editor"] }

hasPermission(user, "update:post");
```

This already improves things: no more hardcoded checks sprinkled across the codebase. But RBAC still has limits. It doesn't handle nuanced cases where context matters.

## Attribute-based access control

What if editors can only update their own posts? Or if readers shouldn't be able to see posts tagged as drafts? Roles alone can't answer those questions.

Attribute-based access control (ABAC) expands the model by considering more than just roles. It factors in attributes of the subject (user), the object (post), the environment, and the policy itself.

![Attribute-based access control diagram](/assets/images/blog/implementing-abac-permissions/02.png){.prefers-media}

Here's a sketch:

```js
const PERMISSIONS = {
  posts: {
    editor: {
      view: true,
      update: (user, post) => user.id === post.authorId,
    },
  },
};
```

Now permissions can be a boolean or a callback. The `hasPermission` function just needs to handle both cases:

```js
const hasPermission(user, resource, action, data) {
	return user.roles.some(role => {
		const permission = PERMISSIONS[role][resource]?.data;
		if (permission === null) return false;
		if (typeof permission === "boolean") return permission;

		return data !== null && permission(user,data)
	})
}
```

And usage looks like this:

```js
hasPermission(user, "posts", "update", post);
```

With ABAC, we get flexibility. Whether the condition is based on user IDs, tags, dates, or environment variables, the rules live in one place and can scale with the application.

## Next steps

What we've built so far is already maintainable and expressive, but there's room to grow:

- Centralize permissions across the stack. Right now, these checks only exist in the front-end. Moving them server-side (or sharing them between client and server) would strengthen security.

- Outsource permission management. Instead of living in a JSON file, permissions could be stored in a dashboard or policy service so non-developers can adjust them.

- Use a library. Rolling your own system is a great learning exercise, but in production a library like [CASL](https://casl.js.org/v6/en).
