---
description: Fetches and implements an animation component from a URL.
---

# Workflow: /motion

## Step 1: Research
- Use the `fetch` tool to read the source code from the URL provided by the user (e.g., https://reactbits.dev...).
- Identify all necessary dependencies (`framer-motion`, `lucide-react`, etc.).

## Step 2: Adapt to Project
- Compare the fetched code with the `.instructions` file.
- Rewrite the component to use the **Tailwind** setup and brand colors.
- Ensure the component is "clean" (remove any demo-only wrappers).

## Step 3: Execution
- Check `package.json`. If a dependency is missing, ask the user: "Should I install [Library] for you?"
- Create the new component file in `@/components/ui/`.
