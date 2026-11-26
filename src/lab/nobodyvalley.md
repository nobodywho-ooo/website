---
date: 2026-11-26
title: NobodyValley
description: "Local LLMs playing Stardew Valley"
url: https://github.com/nobodywho-ooo/nobodyvalley
image: /assets/images/lab/nobodyvalley.png
---

I thought it'd be fun to have LLMs play a game together, and Stardew Valley is pretty good since there's fairly few places that require high interactivity.

So behold, in all it's glory:

<video src="/assets/videos/lab/nobodyvalley/nobodyvalley.mp4" width="1920" height="1080" controls playsinline preload="metadata" aria-label="Four windows of Stardew Valley, alongside a panel of the LLMs' thoughts and actions">
  Four windows of Stardew Valley, alongside a panel of the LLMs' thoughts and actions.
</video>

The model in the lower right is Qwen 3.5 9B running locally on the M4 Mac Mini that is hosting the games, the others are Qwen3.8-Flash-Next running on 2 x NVIDIA DGX Spark. It works by installing a (very vibecoded) mod which allows the agents to query and interact with the game.

It's kinda fun to watch them fumble around, and they can actually progress surprisingly far (I think they unlocked the community center, and got to the mines). I can recommend leaving this on a monitor in your office, your coworkers won't get anything done ;)

1 hour "playthrough" [on YouTube](https://youtu.be/HF9klFJM0qQ).
