# Workflow: /design-component
**Description**: Captures the current local UI, sends it to Google Stitch, and deconstructs it into sections and atomic components.

## Step 1: Visual Capture (Playwright)
- Access the local development server (default: `http://localhost:3000`).
- Use the **Playwright** tool to take a high-resolution, full-page screenshot.
- Extract the DOM tree and computed CSS styles for the current view.

## Step 2: Stitch Handoff (Design Intelligence)
- Invoke the `stitch` tool to create a new Design Project: "AG-Deconstruction-[Timestamp]".
- Upload the screenshot and DOM data as the "Source of Truth."
- **Action**: Instruct the Stitch Agent to "Identify and split the UI into logical Sections (e.g., Navbar, Hero, FeatureGrid, Footer)."

## Step 3: Atomic Breakdown
- For each identified Section, extract:
  - **Typography**: Font-family, weights, and sizes.
  - **Colors**: Primary, secondary, and accent HEX codes.
  - **Interactive Elements**: Identify all Buttons and Links, including their padding and border-radius.

## Step 4: Documentation (DESIGN.md)
- Generate or update a `DESIGN.md` file in the project root with the following:
  - A table mapping each **Visual Section** in Stitch to its **React File** in AG.
  - A list of identified "Design Tokens" (Colors/Fonts) to ensure future consistency.

## Step 5: Verification
- Ask the user: "The UI has been successfully deconstructed in Stitch. Should I now use these tokens to audit our existing Tailwind configuration?"
