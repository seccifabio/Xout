---
name: usability-accessibility
description: Master specialized usability and accessibility audits for cinematic web applications. Focuses on the "Luminance Elevation Protocol" for high-fidelity dark modes and "Commerce ARIA Rituals" for complex shop components.
---

# Usability & Accessibility Mastery (SKILL.md)

This skill governs the sovereign audit protocols for the Murgia platform. It ensures that every UI fragment delivers an executive-grade experience without visual or technical friction.

## 🔳 I. The Luminance Elevation Protocol (LEP)

When performing a contrast audit, especially on nocturnal (bg-noir) or high-intensity (bg-primary) backgrounds, follow these thresholds:

### 1. High-Intensity Backgrounds (Zafferano Giallo)
- **Primary Text**: MUST be solid `black` (`text-noir`). NO opacities.
- **Interactive Layers**: Hover states must invert clearly (e.g., Black to White or vice versa).
- **Secondary Cues**: Minimum `black/60` for legibility.

### 2. Nocturnal Backgrounds (Noir)
- **Metadata/Legal**: Minimum `white/30` or `white/40`. Never usage `white/10` for content.
- **Secondary Body**: `white/50` or `white/60`.
- **Primary Content**: `text-white` or `text-primary`.
- **Decorative Accents**: Minimum `white/20`.

## 🔳 II. The Commerce ARIA Ritual

Complex components like `BagDrawer` and `AperitivoModal` must follow these interaction protocols:

1. **Focus Lock**: When a drawer or modal is manifest, focus must be trapped within the component.
2. **Keyboard Esc**: The `Escape` key must immediately dismiss any temporary terminal/modal.
3. **Screen Readers**:
   - Use `aria-label` for icons without text (e.g., trash icons, close triggers).
   - Use `aria-live="polite"` for cart subtotals and quantity updates.
   - Ensure all `button` elements have descriptive names.

## 🔳 III. Cognitive UX Checklist

Before shipping a UI change, verify:
- **Zero-Friction Path**: Is the primary CTA (e.g., "Aggiungi al Carrello") clearly the most dominant visual element?
- **Hierarchy Mapping**: Does the typographic scale guide the eye from the Narrative (H2) to the Detail (P) to the Action (Button)?
- **State Feedback**: Does every user interaction trigger a micro-animation or color transition?

## 🔳 IV. Automation Rituals

Use the following scripts (when available) to validate the manifest:
- `python .agent/skills/usability-accessibility/scripts/contrast_audit.py`: Scans Tailwind classes for low-opacity rule violations.
- `python .agent/skills/usability-accessibility/scripts/aria_validator.py`: Checks for missing ARIA labels on common interactive patterns.
