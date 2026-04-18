# Workflow: /extract-design
**Description**: Scrapes a URL to identify its design system (Colors, Typography, Buttons).

## Step 1: Visual & Code Analysis
- Use the `fetch` tool or `browser` to access the URL provided by the user.
- **Color Palette**: Extract all unique HEX/RGB codes from backgrounds, text, and borders. Identify the "Primary" and "Secondary" colors by usage frequency.
- **Typography**: Identify the `font-family`, base `font-size`, and `line-height` for H1, H2, and body text.
- **Components**: Inspect `<button>` and `<a>` elements for padding, border-radius, and hover states.

## Step 2: Design System Report
- Present a summary in the chat:
  - **Palette**: [List of Colors]
  - **Fonts**: [Font Stack & Sizes]
  - **UI Style**: [Border Radius, Spacing tokens]

## Step 3: Integration
- Ask: "Should I update our `tailwind.config.js` and `design-system.md` with these tokens?"
