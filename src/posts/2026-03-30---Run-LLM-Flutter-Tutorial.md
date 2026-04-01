---
title: Run LLMs locally in Flutter apps
date: 2026-03-30
categories: ["Flutter", "Guide"]
description: "Tutorial to integrate LLMs locally in your Flutter project"
slug: "run-llm-flutter-guide"
---

![Flutter](/assets/images/blog/2026/run-llm-flutter-guide/ai-llm-on-device-flutter.png)

In this tutorial, you'll learn how to run a large language model (LLM) directly on a user's device — no cloud, no server, no cost. We'll start from scratch, build a working chat interface, and progressively introduce more advanced features: tool calling, sampling, and RAG.

Each concept is explained before the code, so you can follow along whether you're new to on-device AI or just new to NobodyWho.

> 🔗 The [example app](https://github.com/nobodywho-ooo/flutter-starter-example) for this article is available on GitHub if you want to jump straight to working code. It is kept up to date with the latest features — if you want the code that matches this tutorial exactly, check out [this commit](https://github.com/nobodywho-ooo/flutter-starter-example/tree/eba1ec3d3e75dd44e80a91db603c04dd21b47cf3).

---

## Why Run AI On-Device?

Most AI features rely on a cloud API: you send a request to a remote server, it runs the model, and sends a response back. That works well, but it comes with tradeoffs.

Running the model directly on the device avoids all of them:

- **Works offline** — no internet connection required
- **Privacy by design** — user data never leaves the device
- **Low latency** — no network round-trip
- **No cloud costs** — inference is free

The tradeoff is raw capability: on-device models are smaller and less powerful than frontier cloud models. But for many use cases — summarization, chatbots, or local search — they're more than good enough.

---

## About NobodyWho

We'll use the [NobodyWho](https://github.com/nobodywho-ooo/nobodywho) library throughout this tutorial. It wraps [llama.cpp](https://github.com/ggerganov/llama.cpp) in Rust and exposes a clean Flutter API for running any model in `.gguf` format.

Install it with:

```bash
flutter pub add nobodywho
```

Then initialize the engine in `main.dart` before your app launches:

```dart
import 'package:nobodywho/nobodywho.dart' as nobodywho;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await nobodywho.NobodyWho.init();
  runApp(const MyApp());
}
```

---

## Choosing and Loading a Model

### Picking a Model

We'll use **LFM2**, a new generation of hybrid models developed by Liquid AI, specifically designed for edge AI and on-device deployment. Models must be in `.gguf` format; most will work with NobodyWho, though some may fail due to chat template formatting issues. See the [model selection guide](https://docs.nobodywho.ooo/model-selection/) for more details.

### Getting the Model onto the Device

You have two options:

| Approach | Pros | Cons |
|---|---|---|
| **Bundle in assets** | Simple setup, great for development | Increases app size significantly |
| **Download on demand** | Keeps app size small | Requires more implementation work |

For this tutorial, we'll bundle the model in assets to keep things simple. In production, you'd want to use a download-on-demand approach with something like [background_downloader](https://pub.dev/packages/background_downloader).

**Steps:**

1. Create an `assets/` folder at the root of your project (if it doesn't exist).
2. Register it in `pubspec.yaml`:

```yaml
flutter:
  assets:
    - assets/
```

3. Download [this GGUF model](https://huggingface.co/unsloth/LFM2-700M-GGUF/resolve/main/LFM2-700M-Q4_K_M.gguf?download=true), rename it `model.gguf`, and place it in the `assets/` folder.

### Accessing the Model at Runtime

NobodyWho reads the model from the filesystem, so we copy it from Flutter's asset bundle to the app's documents directory on first launch. Add `path_provider` to handle this:

```bash
flutter pub add path_provider
```

```dart
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

final dir = await getApplicationDocumentsDirectory();
final model = File('${dir.path}/model.gguf');

if (!await model.exists()) {
  final data = await rootBundle.load('assets/model.gguf');
  await model.writeAsBytes(data.buffer.asUint8List(), flush: true);
}
```

---

## Basic Chat

With the model in place, you're ready to start a conversation. Here's the simplest possible usage — good for testing or when you don't need a full chat UI:

```dart
final chat = await nobodywho.Chat.fromPath(modelPath: model.path);
final msg = await chat.ask('Is water wet?').completed();
print(msg);
```

### Putting It Together

Here's the complete minimal app so far:

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:nobodywho/nobodywho.dart' as nobodywho;
import 'package:path_provider/path_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await nobodywho.NobodyWho.init();
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  Future<void> _onPressed() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final model = File('${dir.path}/model.gguf');
      if (!await model.exists()) {
        final data = await rootBundle.load('assets/model.gguf');
        await model.writeAsBytes(data.buffer.asUint8List(), flush: true);
      }
      final chat = await nobodywho.Chat.fromPath(modelPath: model.path);
      final msg = await chat.ask('How do I code a button in Flutter?').completed();
      debugPrint(msg);
    } catch (err) {
      debugPrint("Error: $err");
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Center(
          child: ElevatedButton(
            onPressed: _onPressed,
            child: const Text("Ask - How do I code a button in Flutter?"),
          ),
        ),
      ),
    );
  }
}
```

For customization options like system prompts and context size, see the [Chat documentation](https://docs.nobodywho.ooo/flutter/chat/).

---

## Building a Chat Interface

A one-shot `ask().completed()` call is fine for single questions, but a real chat interface needs to stream tokens as they arrive — otherwise users stare at a blank screen until the full response is ready.

### Streaming Tokens

```dart
final response = chat.ask('How do I code a button in Flutter?');

await for (final token in response) {
  print(token); // Each token arrives as it's generated
}
```

A *token* is the smallest unit a model generates — typically a word fragment, punctuation mark, or whitespace character.

### Handling the Streaming Content

```dart
class _ChatScreenState extends State<ChatScreen> {
  final List<nobodywho.Message> _messages = [];
  final TextEditingController _textController = TextEditingController();

  String? _streamingContent;
  bool _responding = false;

  Future<void> _ask() async {
    final userInput = _textController.text.trim();
    if (userInput.isEmpty || _responding) return;

    setState(() {
      _responding = true;
      _streamingContent = null;
    });

    final tokenStream = chat.ask(userInput);

    await for (final token in tokenStream) {
      setState(() {
        _streamingContent = (_streamingContent ?? '') + token;
      });
    }

    // ...continued below
  }
}
```

### Updating the Message List

Once the stream completes, fetch the full chat history and update your UI state:

```dart
final history = await chat.getChatHistory();
final List<nobodywho.Message> messages = [];

for (var message in history) {
  messages.add(
    message.copyWith(
      content: message.content,
    ),
  );
}

setState(() {
  _messages.clear();
  _messages.addAll(messages);
  _streamingContent = null;
  _responding = false;
});
```

### Wiring Up the UI

- Connect your `TextField` to call `_ask()` via `onSubmitted`
- Render `_messages` in a `ListView`
- Append `_streamingContent` at the bottom while streaming

---

## Tool Calling

Tool calling lets the model interact with the outside world. You define a set of functions — each with a name, a description, and an implementation — and the model decides when and how to call them based on the user's request.

```dart
import 'dart:math' as math;
import 'package:nobodywho/nobodywho.dart' as nobodywho;

final circleAreaTool = nobodywho.Tool(
  name: "circle_area",
  description: "Calculates the area of a circle given its radius",
  function: ({required double radius}) {
    final area = math.pi * radius * radius;
    return "Circle with radius $radius has area ${area.toStringAsFixed(2)}";
  },
);

final getWeatherTool = nobodywho.Tool(
  name: "get_weather",
  description: "Get the current weather for a given city",
  function: ({required String city}) async {
    return await fetchWeather(city);
  },
);

final chat = await nobodywho.Chat.fromPath(
  modelPath: model.path,
  tools: [circleAreaTool, getWeatherTool],
);

final response = await chat
    .ask('What is the area of a circle with a radius of 2?')
    .completed();
print(response);
```

The model reads each tool's `description` to decide when to call it, so writing clear, specific descriptions matters.

See the [Tool Calling documentation](https://docs.nobodywho.ooo/flutter/tool-calling/) for more.

---

## Sampling

When generating a token, the model produces a probability distribution over every possible next token. A *sampler* controls how the final token is chosen from that distribution.

The default behavior involves some randomness, which produces natural, varied output. But you can tune it:

- **Lower temperature** → more deterministic, predictable output
- **Higher temperature** → more creative, varied output
- **Constrained sampling** → force output into a specific format, such as JSON

```dart
final chat = await nobodywho.Chat.fromPath(
  modelPath: model.path,
  sampler: nobodywho.SamplerPresets.temperature(temperature: 0.2),
);
```

See the [Sampling documentation](https://docs.nobodywho.ooo/flutter/sampling/) for more.

---

## RAG

Retrieval-Augmented Generation (RAG) combines document search with LLM generation. The model uses retrieved documents to ground its responses in your knowledge base.

### Example: A Customer Service Assistant

```dart
import 'package:nobodywho/nobodywho.dart' as nobodywho;

Future<void> main() async {
  // The cross-encoder re-ranks retrieved documents by relevance.
  // Recommended model:
  // https://huggingface.co/gpustack/bge-reranker-v2-m3-GGUF/resolve/main/bge-reranker-v2-m3-Q8_0.gguf
  // Follow the same approach as the chat model to import the reranker model.
  final crossencoder = await nobodywho.CrossEncoder.fromPath(
    modelPath: rerankerModel.path,
  );

  final knowledge = [
    "Our company offers a 30-day return policy for all products",
    "Free shipping is available on orders over \$50",
    "Customer support is available via email and phone",
    "We accept credit cards, PayPal, and bank transfers",
    "Order tracking is available through your account dashboard",
  ];

  final searchKnowledgeTool = nobodywho.Tool(
    name: "search_knowledge",
    description: "Search the knowledge base for relevant information",
    function: ({required String query}) async {
      final ranked = await crossencoder.rankAndSort(query: query, documents: knowledge);
      final topDocs = ranked.take(3).map((e) => e.$1).toList();
      return topDocs.join("\n");
    },
  );

  final chat = await nobodywho.Chat.fromPath(
    modelPath: model.path,
    systemPrompt:
        "You are a customer service assistant. Use the search_knowledge tool "
        "to find relevant information from our policies before answering.",
    tools: [searchKnowledgeTool],
  );

  final response = await chat.ask("What is your return policy?").completed();
  print(response);
}
```

See the [Embeddings & RAG documentation](https://docs.nobodywho.ooo/flutter/embeddings-and-rag/) for more.

---

## What's Next?

You now have a complete foundation for building on-device AI features in Flutter:

- Load and run a GGUF model
- Build a streaming chat interface
- Extend the model with tool calling
- Control output style with sampling
- Ground responses in a knowledge base with RAG

From here, you can explore the full [NobodyWho documentation](https://docs.nobodywho.ooo/) or dig into the [example app](https://github.com/nobodywho-ooo/flutter-starter-example) to see everything working end to end.