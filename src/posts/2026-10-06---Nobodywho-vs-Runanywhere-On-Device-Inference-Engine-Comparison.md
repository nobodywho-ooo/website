---
title:  "NobodyWho vs RunAnywhere: On-Device Inference Engine Comparison"
date: 2026-10-06
author: Pierre Bresson
categories: ["Technical","Comparison"]
description: "NobodyWho vs RunAnywhere compared on performance, features, platform support and licensing."
slug: "nobodywho-vs-runanywhere"
---

On paper, NobodyWho and RunAnywhere look almost identical. They run LLMs locally on the consumer device such as laptop or phone, are built on llama.cpp, and both list the same features across Kotlin, Swift, Python, Flutter and React Native. The differences only show up once you put them in the same app and start a real conversation. That's exactly what I did, side by side on an iPhone.

Here is a brief summary of the technical findings:

- **Speed:** single-prompt generation speed is almost the same, but RunAnywhere gets slower with every turn of a conversation while NobodyWho stays flat.
- **Multimodal:** RunAnywhere accepts one image per request and no audio. NobodyWho lets you mix several images and audio files in one prompt.
- **Tool calling:** RunAnywhere forgets previous tool results, so it can't answer follow-up questions about them.
- **Structured output:** RunAnywhere doesn't constrain generation to your JSON schema properly.

Every result can be reproduced with our [test app on GitHub](https://github.com/pielouNW/runanywhere-react-native-starter-app).

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

To compare both engines under the same conditions, I added NobodyWho to the [RunAnywhere React Native Starter App](https://github.com/RunanywhereAI/react-native-starter-app) and ran both side by side on an iPhone Air. The comparison covers **speed**, **multimodal input**, **tool calling** and **structured output**.

I used the React Native SDKs, but none of these issues are specific to React Native. They come from RunAnywhere's inference engine and APIs, so they affect every platform and language it supports. You can [check out the test app](https://github.com/pielouNW/runanywhere-react-native-starter-app) and run it on your own device to reproduce every result. Note that the RunAnywhere starter app needed a few fixes before it would build with Xcode 27, which you can find listed in the appendix at the end of this article.

### Speed

The speed tests were done on an iPhone Air with the Qwen3 0.6B model and using the same configuration.

On a single prompt, generation speed is almost identical, and both answers start in under a quarter of a second:
- RunAnywhere generates 71.2 tokens per second (tok/s), with a time to first token (TTFT) of 217 ms.
- NobodyWho generates 74.5 tok/s, with a TTFT of 46 ms.

![Single-turn speed test on iPhone Air](/assets/images/blog/2026/nobodywho-vs-runanywhere/single-turn-speed.png)

The real problem appears in a conversation, where **RunAnywhere's TTFT grows with every turn**. Over a 20-turn conversation, it climbs from 147 ms to 471 ms (3.2× slower), while NobodyWho stays between 33 ms and 60 ms.

![Multi-turn speed test on iPhone Air](/assets/images/blog/2026/nobodywho-vs-runanywhere/multi-turn-ttft.png)

This happens because on every turn, RunAnywhere starts from an empty cache and re-processes the system prompt, the entire chat history and the new message. NobodyWho keeps the conversation in its KV cache and only processes the new message. With RunAnywhere, **the longer the conversation, the slower the response**.

NobodyWho currently shows the same growing TTFT issue with hybrid models like Qwen3.5, since the cache can't yet be reused between turns in the same way. However, a [fix](https://github.com/nobodywho-ooo/nobodywho/pull/637) is currently being implemented.

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

### Structured output

Some use cases need the LLM to produce JSON that follows a given schema. NobodyWho turns the JSON schema into a grammar and constrains generation to it, so the output always matches the schema. RunAnywhere [generates freely and validates afterwards](https://github.com/RunanywhereAI/runanywhere-sdks/blob/main/bindings/react-native/packages/core/src/Public/Api/Llm.ts). In practice, RunAnywhere filled in an optional key and sorted the keys alphabetically.

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

Here is the result, which you can reproduce in the Structured Output section of the app:

```json
{
  "age": 84, // automatic sorting: should not be first
  "name": "Ada Lovelace",
  "nickname": "The Lady of the Lumberjack's Hat", // optional key, should have been omitted
  "tags": ["computer scientist", "inventor", "mathematician"]
}
```

## Choosing between NobodyWho and RunAnywhere

| Requirement | Engine |
| :---- | :---- |
| OSI open-source licence with no revenue ceiling | NobodyWho |
| Optional console for model management | RunAnywhere |
| Wide platform and language support | Both |
| Fast multi-turn conversations | NobodyWho |
| Multimodal support | NobodyWho |
| Tool calling | NobodyWho |
| Schema-constrained structured output | NobodyWho |
| Project health | NobodyWho |

<br>

Unless your project requires a console for model management, **NobodyWho is the best solution** for on-device AI, thanks to its reliable and fast inference engine.

## Appendix: building the RunAnywhere starter app with Xcode 27

The RunAnywhere starter app doesn't build out of the box with Xcode 27 on macOS 27. Both the starter app and the latest RunAnywhere SDK use older versions of React Native ([0.83](https://github.com/RunanywhereAI/react-native-starter-app/blob/e1117fe0e506f1d5edbb148f0d179b75b7f6c7b7/package.json#L25) and [0.85](https://github.com/RunanywhereAI/runanywhere-sdks/blob/acc341c8eae9078a5ab99102bad0ca8bb0377fc7/bindings/react-native/package.json#L63)) instead of the current [0.87](https://reactnative.dev/versions), and they conflict with Xcode 27's stricter compiler. Four problems block the build:

- The version of the fmt C++ library pinned by React Native fails to compile under Xcode 27's newer clang ([fix](https://github.com/pielouNW/runanywhere-react-native-starter-app/blob/f70c06dc344792f9320ee42dad6974dda5c69126/ios/Podfile#L44-L55)).
- The RunAnywhere pods ask to be compiled in Swift 6 mode, but their code doesn't pass Swift 6's stricter concurrency checks ([fix](https://github.com/pielouNW/runanywhere-react-native-starter-app/blob/f70c06dc344792f9320ee42dad6974dda5c69126/ios/Podfile#L57-L64)).
- The SDK's Swift code uses the Objective-C class `AudioCaptureLevel`, but its header isn't exposed to Swift ([fix](https://github.com/pielouNW/runanywhere-react-native-starter-app/blob/f70c06dc344792f9320ee42dad6974dda5c69126/ios/Podfile#L66-L79)), and it calls one of the class's methods by the wrong name ([fix](https://github.com/pielouNW/runanywhere-react-native-starter-app/blob/f70c06dc344792f9320ee42dad6974dda5c69126/.yarn/patches/@runanywhere-core-npm-0.20.19-f4d947d688.patch)).
- The SDK links `librac_commons.a` but CocoaPods never declares it as a build output, so Xcode 27 fails every clean build ([fix](https://github.com/pielouNW/runanywhere-react-native-starter-app/blob/f70c06dc344792f9320ee42dad6974dda5c69126/ios/Podfile#L81-L90)).

Except for the method name, which is fixed with a Yarn patch, all workarounds live in the [Podfile's `post_install` hook](https://github.com/pielouNW/runanywhere-react-native-starter-app/blob/f70c06dc344792f9320ee42dad6974dda5c69126/ios/Podfile#L37), which runs on every `pod install`.

<br>

*Info*

- This article was written on October 6, 2026. Results may have changed since then, on both the NobodyWho and RunAnywhere sides.
- The `@runanywhere` dependencies in `package.json` are set to v0.20.19. [Updating them](https://github.com/pielouNW/runanywhere-react-native-starter-app/tree/feat/ra-v0.20.27) to the latest published version, v0.20.27, did not change the results.
