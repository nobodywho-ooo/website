---
title:  "NobodyWho vs RunAnywhere: On-Device Inference Engine Comparison"
date: 2026-10-06
author: Pierre Bresson
categories: ["Technical","Comparison"]
description: "NobodyWho vs RunAnywhere compared on performances, features, platforms support and licensing."
slug: "nobodywho-vs-runanywhere"
---

NobodyWho and RunAnywhere are both inference engines that lets you run LLMs locally, with multiple languages and frameworks support. This comparison is a deep dive into technical features and performances, platform coverage and licensing.

### Engine, model format and features

[NobodyWho](https://github.com/nobodywho-ooo/nobodywho) runs any GGUF model through llama.cpp, straight from Hugging Face, a URL, or a local path, with no conversion step.

[RunAnywhere](https://github.com/RunanywhereAI/runanywhere-sdks) also used llama.cpp and offers to register MLX/QHexRT backends, but registrering them hasn't changed the following results.

The two libraries have hardware acceleration and similar features: text generation, multimodal input, embeddings, RAG, speech-to-text, text-to-speech, structured output, voice activity dectection and tool calling.

### Platform support

NobodyWho & RunAnywhere support Kotlin, Swift, Python, Flutter, React Native and Expo. Runanywhere also has support for Electron and WebAssembly, while NobodyWho has [started to work](https://github.com/nobodywho-ooo/nobodywho/pull/755) on WebAssembly which will be available soon, and ships on Godot, and runs on [Apple Vision Pro](https://apps.apple.com/us/app/nobodywho-eyes/id6771770762) and [Apple Watch](https://apps.apple.com/us/app/nobodywho-wrist/id6762020355?platform=watch).

### Licensing

NobodyWho uses [EUPL-1.2](https://github.com/nobodywho-ooo/nobodywho/blob/main/LICENSE), an OSI-approved open-source licence. Its repository says proprietary and commercial projects are allowed free of charge. If a modified version of NobodyWho itself is distributed, those engine changes must be open sourced.

RunAnywhere describes its licence as ["RunAnywhere License (Apache 2.0 based, with additional commercial-use terms)."](https://github.com/RunanywhereAI/runanywhere-sdks/blob/main/LICENSE) Its published licence says the free grant applies to organizations with both "Less than $1,000,000 USD in total funding" and "Less than $1,000,000 USD in gross annual revenue." For organizations outside the listed criteria, it says they "must obtain a separate commercial license." If either threshold is later exceeded, the licence says "a commercial license must be obtained within thirty (30) days."

This means that NobodyWho stays free no matter how much funding your company raises or revenue it earns, because its EUPL-1.2 licence sets no funding or revenue ceiling. RunAnywhere is free only while your organization stays under "$1,000,000 in total funding" and "$1,000,000 in gross annual revenue", and once it passes either figure it requires a paid commercial licence.

## Technical comparison

To do this comparison, the [Runanywhere React Native Starter App](https://github.com/RunanywhereAI/react-native-starter-app) has been used and NobodyWho library added. Feel free to checkout the repo and run the app on your machine to verify all the claims. The focus is on significant performance & optimization gaps, that makes a big difference at the end of the day, not on a few ms performance differences.

Unfortunately, Runanywhere starter app isn’t working out of the box unfortunately on macOS, so it had to be fixed to work on latest macOS 27. Both the app and the latest Runanywhere library are using outdated versions of React Native ([0.83](https://github.com/RunanywhereAI/react-native-starter-app/blob/e1117fe0e506f1d5edbb148f0d179b75b7f6c7b7/package.json#L25) and [0.85](https://github.com/RunanywhereAI/runanywhere-sdks/blob/acc341c8eae9078a5ab99102bad0ca8bb0377fc7/bindings/react-native/package.json#L63) instead of current [0.87](https://reactnative.dev/versions)).

### NobodyWho is faster

The speed test was done with llama.cpp on backend both librairies and has been conducted on an iPhone Air and Samsung S25 with Qwen3 0.6B model with same configuration.

The difference is minimal on the first prompt, and invisible for a human eye:
- RunAnywhere reaches 71 tokens per second (tok/sec) and time to first token (TTFT) at 217 ms.
- NobodyWho performs better, with 74.5 tok/sec and TTFT at 46 ms

![Single-turn speed test on iPhone Air](/assets/images/blog/2026/nobodywho-vs-runanywhere/single-turn-speed.png)

However, the big problem is that the **TTFT grow linearly over time for Runanywhere** as you can see below on the screenshot.

![Multi-turn speed test on iPhone Air](/assets/images/blog/2026/nobodywho-vs-runanywhere/multi-turn-ttft.png)

This happens because on every turn, Runanywhere starts from an empty cache and re-reads system prompt, the entire chat history and the new message. It means that **the longer the conversation, the slower the response**.

### Half-baked multimodal support

Multimodal LLM like Gemma 4 can consume image and and/or audio files with a prompt. Let’s see how it’s done on both librairies.

With Runanywhere, you cannot analyze an audio file you can analyze **only one image** at the time:

```ts
// node_modules/@runanywhere/core/src/Public/Api/Vlm.ts

export const vlm = {
  async generate(
    image: ImageInput,
    prompt: string,
    options?: LlmOptions
  ): Promise<GenerationResult> { ... }

  generateStream(
    image: ImageInput,
    prompt: string,
    options?: LlmOptions
  ): AsyncIterable<GenerationEvent> { … }}
```

As you can see in `generate` and `generateStream`, the image is not optional, so every time the user wants to ask something about the image, the image needs to be analyzed again and again, instead of continuing the conversation in a natural way.

It is also **not possible to interleave** image and audio files in a prompt, which can be done with NobodyWho:

```ts
const response = await chat
  .ask(
    new Prompt([
      Prompt.Text("Tell me what you see in the image and what you hear in the audio."),
      Prompt.Image("/path/to/dog.png"),
      Prompt.Image("/path/to/cat.png"),
      Prompt.Audio("/path/to/sound.mp3"),
    ]),
  )
  .completed();
```

### Tool calling messages are dropped

Tool calling allow your LLM to call predefined functions when needed. Let’s say you want to know, the weather, then if the LLM get passed a `get_weather` function, it will call it whenever the user if asking for the weather.

Both librairies are doing this well, but Runanywhere is not capable to reading any previous tool calling previously made. This lead to incoherent answers.

![Tool-calling test on iPhone Air](/assets/images/blog/2026/nobodywho-vs-runanywhere/tool-calling.png)

### Structured Output

In some use cases it might be useful to let the LLM generate JSON output. Here the problem is that RunAnywhere makes optional keys mandatory and sorts alphabetically.

```ts
const SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer', minimum: 0, maximum: 130 },
    nickname: { type: 'string' },
    tags: { 
      type: 'array', 
      items: { type: 'string' }, 
      minItems: 1 
    },
  },
  required: ['name', 'age', 'tags'],
});

const result = await RunAnywhere.llm.generateStructured(
'Give me a short JSON profile of Ada Lovelace. Only include a nickname if she had a well-known one.', 
SCHEMA, 
{ temperature: 0.1 },
'validationOnly'
);
```

As you can see below, the result is innacurate, and you can also check by yourself in the Structured Output section of the app:

```json
{
 "age": 84, // automatic sorting: should not be first
 "name": "Ada Lovelace", // should not have been defined
 "nickname": "The Lady of the Lumberjack's Hat", 
 "tags": ["computer scientist", "inventor", "mathematician"]
}
```

### Project Health

The Runanywhere SDK on Github has 83 issues and 61 open pull-requests while NobodyWho has 6 issues and 9 open pull-requests opened. Both librairies shares similar total numbers of download across the different bindings: 35k for NobodyWho and 39k for Runanywhere (data gathered from [npm](https://www.npmjs.com)/[pub.dev](https://pub.dev/) and others package registries). The stars number is not a valid metric comparison here, as Runanywhere has been spotted buying [fake stars and spamming the Github community](https://news.ycombinator.com/item?id=47163885).

The growing backlog from Runanywhere suggests that the maintainers are struggling to keep up with issues, while NobodyWho small backlog reflects a well maintained project where bugs are solved quickly rather than left to accumulate.

### **Choosing between NobodyWho and RunAnywhere**

| Requirement | Engine |
| :---- | :---- |
| OSI open-source licence with no revenue ceiling  | NobodyWho |
| Optional Console for model management  | RunAnywhere |
| Wide platform & language support  | Both |
| Fast inference  | NobodyWho |
| Multimodal support  | NobodyWho |
| Tool calling  | NobodyWho |
| Structured Output  | NobodyWho |
| Project Health  | NobodyWho |

Unless your project requires a console for model management, NobodyWho is the best solution for on-device AI, thanks to a reliable and fast inference engine.

*Disclamers*

- This article was written the 6th of October and the results might have changed depending when you are reading this article, on both NobodyWho and Runanywhere sides.
- NobodyWho also has this linear growth problem in multi-turn TTFT for hybrid models like Qwen3.5, but a [fix](https://github.com/nobodywho-ooo/nobodywho/pull/637) is being implemented.
- `@runanywhere` dependencies in `package.json` are set to v0.20.19, but [updating them](https://github.com/pielouNW/runanywhere-react-native-starter-app/tree/feat/ra-v0.20.27) to latest v0.20.27 also didn’t change the results