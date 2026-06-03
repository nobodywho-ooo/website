---
title: "Apple Watch & Vision Pro apps"
date: 2026-06-03
categories: ["Apps", "Swift"]
description: "NobodyWho Swift bindings are now available! This article briefly introduces some of the interesting things we dealt with during development."
image: /assets/images/blog/2026/apple-watch-vision-pro-apps/apple-watch-vision-pro.png
slug: "apple-watch-vision-pro-apps"
---

![Apple Watch Vision Pro](/assets/images/blog/2026/apple-watch-vision-pro-apps/apple-watch-vision-pro.png)

We are excited to announce the release of our two first apps! These apps are personnal AI assistants that runs completely offline powered by NobodyWho inference engine.

---

## Apple Watch

This app is a standalone Apple Watch app, meaning it can work without any iOS companion app. It's the **world's first** Apple Watch app that can run an AI model locally!
The idea was to create an app that could answer simple questions on the go, off the grid, in one shot, which is why we didn't bother persist conversations.

Since computation power is limited on the Apple Watch without Metal acceleration, we are limited in terms of models we can run. Currently, we support models from [Prism ML](https://prismml.com/) and [Liquid AI](https://www.liquid.ai/), like the LFM2.5 with 700 million parameters and the 1-bit Bonsai which has 1,7 billion parameters.

As the smaller models gets smarter with time, it opens the road to better answer on the Apple Watch and we are very excited for the new small language models to come!

Links:
- [App Store](https://apps.apple.com/us/app/nobodywho-wrist/id6762020355?platform=watch)
- [Github repository](https://github.com/nobodywho-ooo/NobodyWho-Watch)

---

## Vision Pro

Following the Apple Watch app path, we've decided to build an app that can run large, clever and thinking models. Streaming answers render beautifuly thanks to [LLMStream](https://github.com/synth-inc/LLMStream) library. Models from Prism ML and Liquid AI are also supported, as well as Qwen3, a thinking model.

Links:
- [App Store](https://apps.apple.com/us/app/nobodywho-eyes/id6771770762)
- [Github repository](https://github.com/nobodywho-ooo/NobodyWho-Vision-Pro)

---

## Who We Are

We're NobodyWho, a local inference library, which enables running small models on edge-devices for [Swift](https://docs.nobodywho.ooo/swift/) and several other languages.
We value open-source code, control over your models, solid software engineering, standardization and making simple things simple.

All of which is missing in today's AI world. Running a model with us is as easy as:

```swift
import NobodyWho

let chat = try await Chat.fromPath(modelPath: "./model.gguf")
let response = try await chat.ask("What is the capital of denmark?").completed();

// The capital of Denmark is Copenhagen.
```

If you value the same things, come and [become a contributor](https://github.com/nobodywho-ooo/nobodywho) or just [download and test our library](https://docs.nobodywho.ooo/).
