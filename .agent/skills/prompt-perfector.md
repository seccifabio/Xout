---
name: prompt-perfector
description: Refines vague prompts using the CO-STAR framework.
argument-hint: [your rough idea here]
---

# Skill: Prompt Perfector (The Mirror)
**Trigger**: When the user asks to "perfect a prompt" or provides a request in triple quotes `"""`.

## Instructions
1. **Analyze**: Identify the Goal, Context, and Constraints in the user's raw input.
2. **Identify Gaps**: Look for missing details like:
   - Specific libraries to use (e.g., Shadcn, Tailwind).
   - Tone/Persona requirements.
   - Output format (Code, Markdown, Step-by-step).
3. **Rewrite**: Reconstruct the prompt using the **CO-STAR Framework**:
   - **(C)ontext**: Background info.
   - **(O)bjective**: The specific task.
   - **(S)tyle**: Professional/Creative/Minimalist.
   - **(T)one**: The "vibe" of the response.
   - **(A)udience**: Who is this for?
   - **(R)esponse**: The exact format needed.

## Evaluation
Ask the user: "This improved prompt adds [X] and [Y] for better results. Should I run this now, or would you like to tweak the Objective?"
