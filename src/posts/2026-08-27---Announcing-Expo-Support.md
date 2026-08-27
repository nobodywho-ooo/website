---
title: Announcing Expo support for NobodyWho
date: 2026-08-27
categories: ["Expo", "React Native", "Release"]
description: "NobodyWho now works with Expo — run on-device LLMs in your Expo apps."
image: /assets/images/blog/2026/announcing-expo-support/expo-nobodywho-llm.png
slug: "announcing-expo-support"
---

![NobodyWho announces Expo support](/assets/images/blog/2026/announcing-expo-support/expo-nobodywho-llm.png)

NobodyWho now works with [Expo](https://expo.dev/). You can add `react-native-nobodywho` to an Expo project and ship an LLM that runs entirely on your users' phones. No API keys, no servers to babysit, no per-token bill at the end of the month, just a `.gguf` model to download.

To help you get up and running quickly, we've also published a full [Expo starter example](https://github.com/nobodywho-ooo/expo-starter-example) that wires up every feature in an Expo app you can run within minutes.

## Why on-device?

Most AI features in mobile apps today route every processing request through a hosted API. Running the model directly on the user's device is a different shape of product, and it brings several benefits:

- **Privacy by design** — user data never leaves the device
- **Works offline** — no internet connection required
- **Low latency** — no network round trip on every interaction
- **No cloud costs** — inference is free, no per-token billing

The tradeoff is raw capability: local models are smaller than frontier cloud models, but for chat, summarization, classification, transcription, and many agentic workflows they're more than enough. And on modern phones, GPU-accelerated inference (Metal on iOS, Vulkan on Android) makes them fast.

## What you get

You get the same core API as our other bindings:

- **Text generation**: streaming, token-by-token chat with full conversation memory
- **Tool calling**: type-safe function calling that generates structured grammars directly from your TypeScript function signatures
- **Multimodal input**: feed images and audio straight to a vision or audio-capable model
- **Text-to-speech (TTS)**: synthesize natural-sounding WAV audio locally with Kokoro, Pocket-tts, and Supertonic backends
- **Speech-to-text (STT)**: transcribe audio into text with Whisper models
- **Voice activity detection (VAD)**: reliably detect speech from silence with Silero VAD
- **Embeddings & RAG**: an embedding encoder plus a cross-encoder reranker for semantic search
- **Model downloading**: load models directly from Hugging Face (`hf://…`) or any URL, on demand
- **Any `.gguf` model**: Gemma, Qwen, Mistral, LFM, Granite, and thousands more

Under the hood you also get conversation-aware preemptive context shifting, so you keep full conversation memory without hard message-length limits. It works on both iOS and Android.

## Getting started

Install the package in your Expo project:

```bash
npx expo install react-native-nobodywho
```

A minimal streaming chat looks like this:

```ts
import { Chat } from "react-native-nobodywho";

const chat = await Chat.fromPath({
  modelPath: "/path/to/model.gguf",
  useGpu: true,
});

for await (const token of chat.ask("Is water wet?")) {
  console.log(token);
}
```

Because NobodyWho ships native code, you'll run a prebuild (`npx expo run:ios` / `npx expo run:android`) and cannot use Expo Go. The first run links the native modules and generates the `ios/` and `android/` folders for you.

## One core, many languages

Expo joins a growing list of NobodyWho targets. The same Rust core wrapping [llama.cpp]([llama.cpp](https://github.com/ggerganov/llama.cpp)) now powers bindings across:

- **Godot** — drop-in nodes for game dialogue, NPCs, and tooling
- **Python** — for scripting, prototyping, and ML workflows
- **Swift** — native iOS, macOS, watchOS, and visionOS apps
- **Kotlin** — native Android and cross-platform JVM desktop apps
- **Flutter** — cross-platform mobile and desktop apps
- **React Native / Expo** — the JavaScript/TypeScript mobile ecosystem

That's the whole point of NobodyWho: one well-maintained inference core, with bindings for whichever language or framework you need. Every binding gets the same feature set, so you don't have to give up capabilities to use the tools you prefer.

## Join the community

We'd love to hear what you build with NobodyWho on Expo! Come and meet the people building with NobodyWho and get help:

- **[GitHub](https://github.com/nobodywho-ooo/nobodywho)** — open an issue if you hit a bug, or a discussion if you have an idea.
- **[Discord](https://discord.gg/qhaMc2qCYB)** — the best place to ask questions, share what you're working on, and chat with the team and other NobodyWho users.