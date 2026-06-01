---
title: Announcing Kotlin bindings for NobodyWho
date: 2026-06-01
categories: ["Kotlin", "Release"]
description: "NobodyWho now ships Kotlin bindings — run LLMs fully on-device in your Android and JVM apps, no cloud or server required."
slug: "announcing-kotlin-bindings"
---

You can now add NobodyWho as a Gradle dependency and ship an LLM that runs entirely on your users' devices. No API keys, no servers to babysit, no per-token bill at the end of the month — just a `.gguf` file on the device and a chat loop in your app.

## Why on-device?

Most AI features in mobile apps today route every request through a hosted API. Running the model directly on the user's device is a different shape of product, and it brings real benefits:

- **Privacy by design** — user data never leaves the device
- **Works offline** — no internet connection required
- **Low latency** — no network round trip on every interaction
- **No cloud costs** — inference is free, no per-token billing

The tradeoff is raw capability — local models are smaller than frontier cloud models — but for chat, summarization, classification, and many agentic workflows they're more than enough.

## What you get

The Kotlin bindings expose the same core API our Godot, Rust, Python, Flutter, Swift, and React Native users already know, including:

- Streaming chat with full token-by-token output via Kotlin `Flow`
- Tool calling with automatic parameter extraction via Kotlin reflection
- Sampling controls (temperature, constrained/JSON output, ...)
- Embeddings and a cross-encoder for RAG
- Feed image and audio inputs directly to your LLM
- Any model in `.gguf` format, powered by [llama.cpp](https://github.com/ggerganov/llama.cpp) under the hood

It works on Android and anywhere else the JVM runs.

## Getting started

A minimal chat looks like this:

```kotlin
import ai.nobodywho.Chat
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val chat = Chat.fromPath(modelPath = "./model.gguf")
    val response = chat.ask("Is water wet?").completed()
    println(response)
}
```

For streaming, use `asFlow()`:

```kotlin
chat.ask("Is water wet?").asFlow().collect { token ->
    print(token)
}
```

For the full setup — picking a model, getting the `.gguf` onto the device, wiring up a streaming chat UI — see the [Kotlin documentation](https://docs.nobodywho.ooo/kotlin/).

## Tool calling with reflection

One of the nicest things about the Kotlin bindings is tool calling. Kotlin's reflection API lets NobodyWho automatically extract parameter names and types from your function, so you don't have to declare them twice.

```kotlin
fun getWeather(city: String, unit: String): String {
    return """{"temp": 22, "unit": "$unit"}"""
}

val weatherTool = Tool(
    name = "get_weather",
    description = "Get the current weather for a city",
    function = ::getWeather
)
```

This is similar to how our Flutter bindings work — both use runtime reflection to derive the tool schema directly from the function signature. No redundant schema definitions needed.

## One core, many languages

Kotlin joins a growing list of first-class NobodyWho targets. The same Rust core — wrapping llama.cpp — now powers bindings across:

- **Godot** — drop-in nodes for game dialogue, NPCs, and tooling
- **Rust** — the native API the rest are built on
- **Python** — for scripting, prototyping, and ML workflows
- **Flutter** — cross-platform mobile and desktop apps
- **React Native** — the JavaScript/TypeScript mobile ecosystem
- **Swift** — native iOS, macOS, watchOS, and visionOS apps
- **Kotlin** — Android and JVM apps

That's the whole point of NobodyWho: one well-maintained inference core, with idiomatic bindings for whichever language or framework you actually want to ship in. Every binding gets the same feature set — streaming, tool calling, sampling, embeddings, RAG — so you don't have to give up capabilities to use the language you prefer.

## Join the community

We'd love to hear what you build with the new Kotlin bindings — and meet the people building with NobodyWho across all the other languages too.

- **[Discord](https://discord.gg/qhaMc2qCYB)** — the best place to ask questions, share what you're working on, and chat with the team and other NobodyWho users.
- **[GitHub](https://github.com/nobodywho-ooo/nobodywho)** — open an issue if you hit a bug, or a discussion if you have an idea. And if you like what we're building, give us a star!

Happy hacking!
