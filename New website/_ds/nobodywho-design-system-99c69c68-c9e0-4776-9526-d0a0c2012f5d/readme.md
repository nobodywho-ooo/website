# NobodyWho Design System

The brand and UI system for **NobodyWho** — an inference engine that lets you run large language models locally, on any device.

NobodyWho is a Copenhagen-based, open-source company building on-device LLM inference. The product runs text, vision and speech models entirely on the user's own hardware: no servers, no cloud logging, no API fees. The brand stands for privacy, performance on any hardware, and European open-source AI sovereignty. The library is released under EUPL 1.2 and is free for individuals and companies alike.

This design system encodes the visual language defined in the NobodyWho slide master (`NobodyWho_Template.pptx`, user-edited June 2026) and the public website. It is deliberately quiet: a single regular font weight, a small restrained palette, no decorative furniture, and a signature dark code block.

## Sources

- **Website**: https://nobodywho.ooo/ (home, about, apps, blog)
- **Docs**: https://docs.nobodywho.ooo/
- **GitHub**: https://github.com/nobodywho-ooo/nobodywho (EUPL 1.2)
- **Slide master**: `NobodyWho_Template.pptx` — the colour, type and logo placement rules below are extracted from it.
- **Logo**: https://nobodywho.ooo/assets/favicon/android-chrome-512x512.png

The product ships bindings for **Flutter, React Native, Kotlin, Swift, Python and Godot**, so code samples are a first-class brand surface.

> ⚠️ **Logo placeholder.** The real logo PNG could not be fetched programmatically. `assets/logo-placeholder.svg` is a stand-in. Please drop the real `android-chrome-512x512.png` into `assets/` (suggested name `logo.png`) so slides and kits use the genuine mark.

---

## Content fundamentals

**Voice.** Plain, confident, technical, unhurried. Short declarative sentences. It speaks to developers as peers, never markets at them. The product is the proof, so copy stays factual and lets capability carry the weight.

**Person.** Second person for the reader ("Run any AI model on any device", "Keep it private", "Everything stays on your machine"). First person plural only for the company ("Contact us"). Avoid "I".

**Casing.** Sentence case for headings and buttons ("Run anywhere, no servers required", "Try in 5 minutes", "Explore Docs"). UPPERCASE is reserved for small eyebrows, section labels and stat labels, always with wide tracking.

**Weight.** There is **no bold anywhere**. Every font weight is regular (400). Emphasis is created with colour (navy or steel) and size, never with weight.

**Punctuation.** **No em dashes.** Use a comma or a full stop instead. British English throughout ("colour", "optimised", "licence", "behaviour").

**Emoji.** None. The brand does not use emoji in product or marketing copy.

**Representative copy.**
- "Run any AI model on any device" / "Secure, fast & open-source"
- "Keep it private. Everything stays on your machine, no cloud logging, no exceptions."
- "No internet needed. Run models in flight or in secure environments."
- "Completely free, no API keys, or usage fees."
- "European open-source AI."

---

## Visual foundations

**Palette.** White page, near-black text (`#0A0A0A`). Two accents only: **navy** `#2952A3` for primary accent words and stat numbers, **steel** `#628395` for secondary accents, eyebrows and the logo tint. Body copy is a soft `#3D3D3D`; labels and page numbers are `#A3A3A3`. The single divider grey is `#E0E0E0`. CTA buttons are a deeper blue `#1C3D80`.

**Code block.** The one piece of high-contrast drama: a near-black panel (`#0A0A0A`) with a slightly lighter top bar (`#1A1A1A`), white text and punctuation, **yellow** (`#FFD21E`) string literals and grey comments, set in Courier New.

**Type.** Inter for everything text and UI; Courier New for code. One weight (400). Hierarchy is built from size and colour. Eyebrows and labels are uppercase with ~0.14em tracking.

**Backgrounds.** Flat white. No gradients, no photographic full-bleeds, no textures, no repeating patterns. The dark code panel is the only dark surface.

**Decoration.** None. No decorative bars, stripes, or accent rules. The *only* permitted rule line is a 1px `#E0E0E0` divider beneath a heading on body slides.

**Borders & radii.** Mostly square. Hairline `1px` `#E0E0E0` borders define cards. Buttons, inputs and badges take a small 4px radius; code panels and cards take 8px; tags may be fully pill-shaped. No drop shadows anywhere — surfaces are distinguished by their hairline border, not elevation.

**Spacing & layout.** Calm and generous on a 4px scale. Slides are 16:9 with wide margins. Content is left-aligned by default. The logo sits in the top-right corner of slides (see geometry tokens).

**Motion.** Restrained. Quiet opacity fades and short (~120ms) ease transitions. No bounces, no parallax, no infinite decorative loops.

**Interaction states.** Hover lowers opacity to ~0.82 (or steps the fill darker on the CTA). There is no scale/shrink press effect; keep it flat and calm. Disabled is 0.4 opacity.

**Imagery vibe.** Cool, neutral, technical. Screenshots and product imagery sit on white with hairline framing rather than shadows. When in doubt, show code, not a stock photo.

---

## Iconography

The website uses a **thin line-icon** style (named concepts on the site include Bolt/performance, Lock/privacy, Offline, and a banknote for the free tier). These match the **Lucide** open-source icon set (1.5–2px stroke, rounded joins, monochrome), which is the recommended substitute and is CDN-available.

- **Approach**: monochrome line icons, drawn in `--nw-black` or `--nw-steel`, never filled blobs, never multicolour.
- **Substitution flagged**: the brand's exact SVGs were not in the materials provided, so this system standardises on **Lucide** (`https://unpkg.com/lucide-static`) as the closest match. Swap in the real icon set if/when supplied.
- **No emoji, no Unicode glyph icons.** Use real line icons.

---

## Index

Root:
- `styles.css` — global entry point (consumers link this one file). `@import` manifest only.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`.
- `assets/` — logo placeholder (replace with real PNG).
- `readme.md` — this guide.
- `SKILL.md` — Agent Skill wrapper for use in Claude Code.

Components (`window.NobodyWhoDesignSystem_99c69c.*`):
- `components/core/` — **Button**, **Badge**, **Stat**, **Card** (+ `Card.Title`, `Card.Body`), **Eyebrow**, **Divider**.
- `components/code/` — **CodePanel** (+ `CodePanel.Str`, `CodePanel.Comment`, `CodePanel.Punc`).

Slides:
- `slides/` — sample slides built on the master (title, code, stats, comparison, quote, closing).

Foundation specimen cards live beside the tokens and components and populate the Design System tab (groups: Colors, Type, Spacing, Brand, Components, Slides).
