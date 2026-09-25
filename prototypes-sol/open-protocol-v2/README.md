# Open Protocol, second direction

A standalone HTML discussion draft. Open `landing.html` directly, or run `npm start` from the repository root and visit `/prototypes-sol/open-protocol-v2/landing.html`.

Three sections: abstract hero, binding usage snippets with the agent-skill command, and modalities. IBM Plex Sans replaces the serif treatment. The original prototype wordmark and deeper blue remain. Current work focuses on desktop content, not mobile refinement.

- Artwork: optimized copy of `New website/assets/blue-01.jpg`, supplied in the reference folder as `henrik-donnestad-Lkpax1rj1No-unsplash.jpg`.
- Framework logos: existing assets from `../quiet-copenhagen/assets/icons/`.
- Usage snippets: adapted from the official binding quickstarts at `https://docs.nobodywho.ooo/`. Each tab identifies its file, platform, installation, and required context. Supply a local GGUF model; Flutter also requires one-time initialization, and Godot requires the described scene nodes.
- Syntax highlighting: vendored Prism 1.30.0 from the existing dependency. License in `assets/vendor/`.
- Modality icons: Tabler outline icons, with their license in `assets/icons/`.
- Fonts and licenses: `fonts/`. Design tokens: `site.css`. Tabs and clipboard behavior: `site.js`.

About and Pricing still link to the original prototype. Light mode only. No framework, animation, or production migration. With JavaScript disabled, all binding instructions remain visible.
