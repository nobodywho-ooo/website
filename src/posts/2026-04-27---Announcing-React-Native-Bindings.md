---
title: Announcing React Native bindings for NobodyWho
date: 2026-04-27
categories: ["React Native", "Release"]
description: "NobodyWho now ships React Native bindings — run LLMs fully on-device in your React Native apps, no cloud or server required."
image: /assets/images/blog/2026/announcing-react-native-bindings/react-native-llm.png
slug: "announcing-react-native-bindings"
---

![NobodyWho running an on-device LLM in a React Native app](/assets/images/blog/2026/announcing-react-native-bindings/react-native-llm.png)

You can now `npm install react-native-nobodywho` and ship an LLM that runs entirely on your users' phones. No API keys, no servers to babysit, no per-token bill at the end of the month — just a `.gguf` file on the device and a chat loop in your app.

## Why on-device?

Most AI features in mobile apps today route every request through a hosted API. Running the model directly on the user's device is a different shape of product, and it brings real benefits:

- **Privacy by design** — user data never leaves the device
- **Works offline** — no internet connection required
- **Low latency** — no network round trip on every interaction
- **No cloud costs** — inference is free, no per-token billing

The tradeoff is raw capability — local models are smaller than frontier cloud models — but for chat, summarization, classification, and many agentic workflows they're more than enough.

## What you get

The React Native bindings expose the same core API our Godot, Rust, Python, and Flutter users already know, including:

- Streaming chat with full token-by-token output
- Tool calling, so the model can call into your JS/TS code
- Sampling controls (temperature, constrained/JSON output, …)
- Embeddings and a cross-encoder for RAG
- Feed image and audio inputs directly to your LLM
- Any model in `.gguf` format, powered by [llama.cpp](https://github.com/ggerganov/llama.cpp) under the hood

It works on both iOS and Android.

## Getting started

```bash
npm install react-native-nobodywho
```

A minimal chat looks like this:

```ts
import { Chat } from "react-native-nobodywho";

const chat = await Chat.fromPath({ modelPath: "/path/to/model.gguf" });

for await (const token of chat.ask("Is water wet?")) {
  console.log(token);
}
```

For the full setup — picking a model, getting the `.gguf` onto the device, wiring up a streaming chat UI — see the [React Native documentation](https://docs.nobodywho.ooo/react-native/) and the [starter example app](https://github.com/nobodywho-ooo/react-native-starter-example) on GitHub.

## One core, many languages

React Native joins a growing list of first-class NobodyWho targets. The same Rust core — wrapping llama.cpp — now powers bindings across:

- **Godot** — drop-in nodes for game dialogue, NPCs, and tooling
- **Rust** — the native API the rest are built on
- **Python** — for scripting, prototyping, and ML workflows
- **Flutter** — cross-platform mobile and desktop apps
- **React Native** — and now the JavaScript/TypeScript mobile ecosystem

That's the whole point of NobodyWho: one well-maintained inference core, with idiomatic bindings for whichever language or framework you actually want to ship in. Every binding gets the same feature set — streaming, tool calling, sampling, embeddings, RAG — so you don't have to give up capabilities to use the language you prefer.

## Join the community

We'd love to hear what you build with the new React Native bindings — and meet the people building with NobodyWho across all the other languages too.

- **[Discord](https://discord.gg/qhaMc2qCYB)** — the best place to ask questions, share what you're working on, and chat with the team and other NobodyWho users.
- **[GitHub](https://github.com/nobodywho-ooo/nobodywho)** — open an issue if you hit a bug, or a discussion if you have an idea.

Happy hacking!
