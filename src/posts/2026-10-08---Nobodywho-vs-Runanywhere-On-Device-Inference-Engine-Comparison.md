---
title:  "NobodyWho vs RunAnywhere: On-Device Inference Engine Comparison"
date: 2026-10-08
author: Pierre Bresson
categories: ["Technical","Comparison"]
description: "NobodyWho vs RunAnywhere compared on performance, features, platform support and licensing."
slug: "nobodywho-vs-runanywhere"
---

On paper, NobodyWho and RunAnywhere look almost identical. They run LLMs locally on consumer devices such as laptops and phones, are built on llama.cpp, and both list the same features across Kotlin, Swift, Python, Flutter and React Native. The differences only show up once you put them in the same app and start a real conversation. That's exactly what I did, side by side on iPhone and Android.

Here is a brief summary of the technical findings:

- **Speed:** NobodyWho starts answering sooner on a single prompt, and RunAnywhere gets slower with every turn of a conversation, up to 33× slower after 20 turns on Android.
- **Multimodal:** RunAnywhere accepts one image per request and no audio. NobodyWho lets you mix several images and audio files in one prompt.
- **Tool calling:** RunAnywhere forgets previous tool results, so it can't answer follow-up questions about them.

Every result can be reproduced with my [test app on GitHub](https://github.com/pielouNW/runanywhere-react-native-starter-app).

Before getting to the benchmarks, let's start with an overview of both libraries: engine, model format and features, platform support and licensing.

## Engine, model format and features

[NobodyWho](https://github.com/nobodywho-ooo/nobodywho) runs any GGUF model through llama.cpp, loaded straight from Hugging Face, a URL or a local path, with no conversion step.

[RunAnywhere](https://github.com/RunanywhereAI/runanywhere-sdks) also uses llama.cpp, and can additionally register MLX and QHexRT (Qualcomm Hexagon NPU) backends. Registering them did not change any of my results below.

Both libraries offer hardware acceleration and a similar feature set: text generation, multimodal input, embeddings, RAG, speech-to-text, text-to-speech, structured output, voice activity detection and tool calling.

## Platform support

NobodyWho and RunAnywhere both support Kotlin, Swift, Python, Flutter, React Native and Expo.

RunAnywhere also supports Electron and WebAssembly. NobodyWho has [started work](https://github.com/nobodywho-ooo/nobodywho/pull/755) on WebAssembly, which will be available soon. NobodyWho also ships for Godot, and runs on [Apple Vision Pro](https://apps.apple.com/us/app/nobodywho-eyes/id6771770762) and [Apple Watch](https://apps.apple.com/us/app/nobodywho-wrist/id6762020355?platform=watch).

## Licensing

NobodyWho uses [EUPL-1.2](https://github.com/nobodywho-ooo/nobodywho/blob/main/LICENSE), an OSI-approved open-source licence, allowing proprietary and commercial projects to use the engine free of charge. However, if you distribute a modified version of NobodyWho itself, those engine changes must be open sourced.

RunAnywhere describes its licence as ["RunAnywhere License (Apache 2.0 based, with additional commercial-use terms)."](https://github.com/RunanywhereAI/runanywhere-sdks/blob/main/LICENSE) For companies, the free grant only applies to organizations with both "Less than $1,000,000 USD in total funding" and "Less than $1,000,000 USD in gross annual revenue." Organizations outside the listed criteria "must obtain a separate commercial license." If either threshold is exceeded later on, "a commercial license must be obtained within thirty (30) days."

In practice, NobodyWho stays free no matter how much funding your company raises or how much revenue it earns. RunAnywhere is free for a company only while it stays under $1M in total funding and $1M in annual revenue. Once it passes either figure, a paid commercial licence is required.

## Technical comparison

To compare both engines under the same conditions, I added NobodyWho to the [RunAnywhere React Native Starter App](https://github.com/RunanywhereAI/react-native-starter-app) and ran both side by side on an iPhone Air and a Samsung S25. The comparison covers **speed**, **multimodal input** and **tool calling**.

I used the React Native SDKs, but none of these issues are specific to React Native. They come from RunAnywhere's inference engine and APIs, so they affect every platform and language it supports. You can [check out the test app](https://github.com/pielouNW/runanywhere-react-native-starter-app) and run it on your own device to reproduce every result. Note that the RunAnywhere starter app needed a few fixes before it would build with Xcode 27, which you can find listed in the appendix at the end of this article.

### Speed

The speed tests were done on both phones with the Qwen3 0.6B model and the same configuration.

On a single prompt, NobodyWho starts answering sooner on both phones, but RunAnywhere generates faster on Android:
- **iPhone Air:** RunAnywhere generates 70.5 tokens per second (tok/s), with a time to first token (TTFT) of 201 ms. NobodyWho generates 70.8 tok/s, with a TTFT of 46 ms.
- **Samsung S25:** RunAnywhere generates 52.4 tok/s, with a TTFT of 1268 ms. NobodyWho generates 32.2 tok/s, with a TTFT of 230 ms.

![Single-turn speed test on iPhone Air and S25](/assets/images/blog/2026/nobodywho-vs-runanywhere/single-turn.png)

The real problem appears in a conversation, where **RunAnywhere's TTFT grows with every turn**. Over 20 turns, it climbs from 147 ms to 471 ms on the iPhone Air (3× slower), and from 333 ms to over 11 seconds on the S25 (33× slower). NobodyWho stays between 33 ms and 60 ms on the iPhone Air, and between 218 ms and 896 ms on the S25. It means that after a few prompts, **NobodyWho is answering faster**, even on Android.

![Multi-turn speed test on iPhone Air and S25](/assets/images/blog/2026/nobodywho-vs-runanywhere/multi-turn.png)

This happens because on every turn, RunAnywhere starts from an empty cache and re-processes the system prompt, the entire chat history and the new message. NobodyWho keeps the conversation in its KV cache and only processes the new message. With RunAnywhere, **the longer the conversation, the slower the response**.

NobodyWho currently shows the same growing TTFT issue with hybrid models like Qwen3.5, since the cache can't yet be reused between turns in the same way. A [fix](https://github.com/nobodywho-ooo/nobodywho/pull/803) is in progress.

### Multimodal input

Multimodal LLMs like Gemma 4 can take images and/or audio files along with a prompt. Let's see how each library handles them.

With RunAnywhere, you cannot send an audio file to the model, and you can only send **one image at a time**:

```ts
// node_modules/@runanywhere/core/src/Public/Api/Vlm.ts

export const vlm = {
  async generate(
    image: ImageInput,
    prompt: string,
    options?: LlmOptions
  ): Promise<GenerationResult> { ... },

  generateStream(
    image: ImageInput,
    prompt: string,
    options?: LlmOptions
  ): AsyncIterable<GenerationEvent> { ... },
};
```

In both `generate` and `generateStream`, the image is a required argument. Every follow-up question about the same image means sending it again and having the model process it again, instead of continuing the conversation naturally.

It is also **not possible to interleave** several images and audio files in a single prompt, which NobodyWho allows:

```ts
const response = await chat
  .ask(
    new Prompt([
      Prompt.Text("Tell me what you see in the images and what you hear in the audio."),
      Prompt.Image("/path/to/dog.png"),
      Prompt.Image("/path/to/cat.png"),
      Prompt.Audio("/path/to/sound.mp3"),
    ]),
  )
  .completed();
```

### Tool calling

Tool calling lets your LLM call predefined functions when needed. For example, if you give the LLM a `get_weather` function, it will call it whenever the user asks about the weather.

Both libraries handle tool calling properly, but RunAnywhere does not keep previous tool calls and their results in the conversation history, so follow-up questions get answered incorrectly.

![Tool-calling test on iPhone Air](/assets/images/blog/2026/nobodywho-vs-runanywhere/tool-calling.png)

The screenshot above compares the official NobodyWho and RunAnywhere apps, both running Qwen3 4B. After a `get_weather` call, NobodyWho answers "What is the humidity?" from the earlier result, while RunAnywhere has forgotten it and asks for the location again.

## Choosing between NobodyWho and RunAnywhere

The two libraries share the same feature list, but the differences become obvious once you use them. With RunAnywhere, the chat slows down with every message, the assistant forgets what its tools just returned, and you can only send one image at a time.

| Requirement | Engine |
| :---- | :---- |
| OSI open-source licence with no revenue ceiling | NobodyWho |
| Wide platform and language support | Both |
| Fast multi-turn conversations | NobodyWho |
| Multimodal support | NobodyWho |
| Tool calling | NobodyWho |

<br>

RunAnywhere is a good fit if you need Electron or WebAssembly support right now. For everything else, **NobodyWho is the better choice for on-device AI**: answers stay fast as conversations grow, tool results carry over to follow-up questions, and the licence stays free however big your company gets.

## Appendix: building the RunAnywhere starter app with Xcode 27

The RunAnywhere starter app doesn't build out of the box with Xcode 27 on macOS 27. Both the starter app and the latest RunAnywhere SDK use older versions of React Native ([0.83](https://github.com/RunanywhereAI/react-native-starter-app/blob/e1117fe0e506f1d5edbb148f0d179b75b7f6c7b7/package.json#L25) and [0.85](https://github.com/RunanywhereAI/runanywhere-sdks/blob/acc341c8eae9078a5ab99102bad0ca8bb0377fc7/bindings/react-native/package.json#L63)) instead of the current [0.87](https://reactnative.dev/versions), and they conflict with Xcode 27's stricter compiler. To get it running, I [fixed four issues in the Podfile](https://github.com/pielouNW/runanywhere-react-native-starter-app/blob/f70c06dc344792f9320ee42dad6974dda5c69126/ios/Podfile#L44-L90) (an outdated fmt C++ library, Swift 6 concurrency errors, an Objective-C class hidden from Swift and an undeclared static library), and a method called by the wrong name with a [Yarn patch](https://github.com/pielouNW/runanywhere-react-native-starter-app/blob/f70c06dc344792f9320ee42dad6974dda5c69126/.yarn/patches/@runanywhere-core-npm-0.20.19-f4d947d688.patch).

<br>

*Info*

- This article was written on October 8, 2026. Results may have changed since then, on both the NobodyWho and RunAnywhere sides.
- The `@runanywhere` dependencies in `package.json` are set to v0.20.19. [Updating them](https://github.com/pielouNW/runanywhere-react-native-starter-app/tree/feat/ra-v0.20.27) to the latest published version, v0.20.27, did not change the results.
