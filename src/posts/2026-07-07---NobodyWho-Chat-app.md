---
title: "NobodyWho Chat app"
date: 2026-07-07
categories: ["Apps", "Swift"]
description: "NobodyWho Swift bindings are now available! This article briefly introduces some of the interesting things we dealt with during development."
image: /assets/images/blog/2026/nobodywho-chat-app/nobodywho-chat-app-preview.png
slug: "nobodywho-chat-app"
---

![NobodyWho Chat app preview](/assets/images/blog/2026/nobodywho-chat-app/nobodywho-chat-preview.png)

We're excited to announce the release of **NobodyWho Chat**, a fully offline AI assistant for iOS & Android, powered by the NobodyWho inference engine.

---

## NobodyWho Chat

NobodyWho Chat brings industry-leading AI models directly to your device. Every conversation happens locally: no data leaves your phone, no internet connection is required, and there are no accounts, subscriptions, or hidden costs.

Ask anything, brainstorm, write, code, or research, and get answers from some of the most capable open-weight models available today, running entirely on your hardware. Download models in the app, and pick from a growing list including **Gemma 4** (Google), **Ministral** (Mistral), **Granite** (IBM), **LFM** models (Liquid AI), **Qwen**, and more.

The app also supports **vision and hearing**: give it an image or an audio clip alongside your question, and multimodal models can make sense of it, all still fully offline. And thanks to NobodyWho's tool calling support, models can reach out to custom functions, like checking the weather or looking up a fact, without ever touching the cloud for your data.

NobodyWho Chat is built with **React Native**, and it's fully **open-source**. The code is on GitHub for anyone curious about how a local LLM chat app comes together, or looking to build their own with [NobodyWho's React Native bindings](https://docs.nobodywho.ooo/react-native/).

Why NobodyWho Chat:
- Works offline, no account required
- Fully private, your data never leaves your device
- Download and use latest AI models
- Open-source

![NobodyWho Chat app download](/assets/images/blog/2026/nobodywho-chat-app/nobodywho-chat-download.png)

Links:
- [App Store]()
- [Google Play]()
- [GitHub repository](https://github.com/nobodywho-ooo/NobodyWho-Chat)

---

## Who We Are

We're NobodyWho, a local inference library that enables running small models on edge devices for [React Native](https://docs.nobodywho.ooo/react-native/) and other frameworks.
We value open-source code, control over your models, solid software engineering, standardization, and making simple things simple.

All of which is missing in today's AI world. Running a model with us is as easy as:

```ts
import { Chat } from "react-native-nobodywho";

const chat = await Chat.fromPath({ modelPath: "./model.gguf" });
const response = await chat.ask("What is the capital of denmark?").completed();

// The capital of Denmark is Copenhagen.
```

If you value the same things, come and [become a contributor](https://github.com/nobodywho-ooo/nobodywho) or just [download and test our library](https://docs.nobodywho.ooo/).
