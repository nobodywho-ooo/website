---
title: "Apple Watch & Vision Pro apps"
date: 2026-06-04
categories: ["Apps", "Swift"]
description: "NobodyWho Swift bindings are now available! This article briefly introduces some of the interesting things we dealt with during development."
image: /assets/images/blog/2026/apple-watch-vision-pro-apps/apple-watch-vision-pro-apps.png
slug: "apple-watch-vision-pro-apps"
---

![Apple Watch Vision Pro](/assets/images/blog/2026/apple-watch-vision-pro-apps/apple-watch-vision-pro-apps.png)

We are excited to announce the release of our first two apps! Both are personal AI assistants that run completely offline, powered by the NobodyWho inference engine.

---

## Apple Watch

This is a standalone Apple Watch app, meaning it works without any iOS companion app. It's the **world's first** Apple Watch app that can run an AI model locally, completely offline!
The idea was to create an app that could answer simple questions on the go, off the grid, in a single shot, which is why we didn't bother persisting conversations.

Since computing power is limited on the Apple Watch without Metal acceleration, we are restricted in the models we can run. Currently, we support models from [Prism ML](https://prismml.com/) and [Liquid AI](https://www.liquid.ai/), such as the LFM2.5 with 700 million parameters (Apple Watch Ultra) and the 1-bit Bonsai with 1.7 billion parameters (Apple Watch Series 11).

As smaller models get smarter over time, the door opens to better answers on the Apple Watch, and we are very excited for the new small language models to come!

Links:
- [App Store](https://apps.apple.com/us/app/nobodywho-wrist/id6762020355?platform=watch)
- [Github repository](https://github.com/nobodywho-ooo/NobodyWho-Watch)

---

## Vision Pro

Following the path set by the Apple Watch app, we decided to build an app that can run large, capable, thinking models. Streamed answers render beautifully thanks to the [LLMStream](https://github.com/synth-inc/LLMStream) library. Models from Prism ML and Liquid AI are supported as well, along with Qwen3, a thinking model.

Links:
- [App Store](https://apps.apple.com/us/app/nobodywho-eyes/id6771770762)
- [Github repository](https://github.com/nobodywho-ooo/NobodyWho-Vision-Pro)

---

## Who We Are

We're NobodyWho, a local inference library that enables running small models on edge devices for [Swift](https://docs.nobodywho.ooo/swift/) and several other languages.
We value open-source code, control over your models, solid software engineering, standardization, and making simple things simple.

All of which is missing in today's AI world. Running a model with us is as easy as:

```swift
import NobodyWho

let chat = try await Chat.fromPath(modelPath: "./model.gguf")
let response = try await chat.ask("What is the capital of Denmark?").completed();

// The capital of Denmark is Copenhagen.
```

If you value the same things, come and [become a contributor](https://github.com/nobodywho-ooo/nobodywho) or just [download and test our library](https://docs.nobodywho.ooo/).
