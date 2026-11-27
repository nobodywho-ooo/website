---
date: 2026-11-26
title: Agentic UI with small models
description: "Adding Agentic UI to our chat app"
url: https://github.com/nobodywho-ooo/NobodyWho-Chat/pull/19
image: /assets/images/lab/chat-agentic-ui-ish.png
---

I experimented with adding Agentic UI[^1] to our showcase chat app, NobodyWho Chat, and managed to create a simple tool call that allows the agent to add some choice buttons to the end of the message:

<video src="/assets/videos/lab/chat-agentic-ui-ish/chat-agentic-ui-ish.mp4" width="315" height="684" controls muted playsinline aria-label="A local LLM on an iPhone answering a cooking question and then offering tappable follow-up choices.">
  A local LLM on an iPhone answering a cooking question and then offering tappable follow-up choices.
</video>

It's super vibed, and is not gonna get merged as-is, but the models seem to be able to use the tool fairly well.

## Failed attempts

Welp, good science is publishing negative results as well, so here I go: I started by trying to add general Agentic UI (tried both A2UI and OpenUI), but the models that I tested with (Bonsai 4B 1bit, Gemma 4 E2B and LFM2.5 2.6B) simply weren't really good enough.

Below, there's two screenshots which show opening a map (but with the wrong coordinates because it doesn't know those) and adding a button (which does nothing because it hallucinates a recipe url).

<div>
  <img src="/assets/images/lab/chat-agentic-ui-ish/map.png" alt="map" width="315" height="685" />
  <img src="/assets/images/lab/chat-agentic-ui-ish/recipe.png" alt="recipe" width="315" height="685" />
</div>

I think purpose-built models for Agentic UI, such as [OUI-1](https://www.openui.com/oui-1) are interesting, but not something that I tried.

[^1]: Or Intelligent UI, or whatever you want to call it. Basically, something where the LLM can generate interactive UI elements.
