---
title: "NobodyWho vs Cactus: On-Device Inference Engine Comparison"
date: 2026-09-16
author: Pierre Bresson
categories: ["Comparison"]
description: "NobodyWho vs Cactus compared on engine design, model format, hardware, platforms, cloud, and licensing."
slug: "nobodywho-vs-cactus"
---

Choosing an on-device inference engine sets where the model runs and under what terms. NobodyWho and Cactus both run models on the user's device, with no API key, no per-request cost, and no data leaving the hardware once the model is downloaded. Underneath, they are different engines. NobodyWho Edge is built on [llama.cpp](https://github.com/ggerganov/llama.cpp) and runs GGUF models. Cactus is a from-scratch engine with its own quantization format, and positions itself as a llama.cpp alternative. This is a technical comparison of NobodyWho vs Cactus across engine and model format, hardware, installation, platform coverage, cloud behaviour, and licensing. The better fit depends on the target device and the commercial model of the product.

## **Engine and model format**

[NobodyWho](https://github.com/nobodywho-ooo) runs GGUF models through llama.cpp. It loads any GGUF file from Hugging Face or a URL directly, with no conversion step, so any model already published in GGUF, at any of the quantization levels the ecosystem provides, runs as-is.

Cactus runs its own format. Cactus Quants (CQ) is a rotation-and-codebook quantization applied to every weight tensor, from 4-bit down to 1-bit, and the engine runs from CQ bundles. You get a bundle by downloading one Cactus has pre-built for its own model catalog (cactus download) or by converting a source model yourself (cactus convert), which [Cactus](https://github.com/cactus-compute/cactus) documents as experimental for models it has not pre-built.

NobodyWho runs the existing GGUF catalog with no conversion step. Cactus's CQ is tuned in-house for on-device size and quality, with published accuracy tables per bit-width, at the cost of depending on its own bundles or an experimental conversion for anything outside its catalog.

Both also cover the parts of an app beyond chat: embeddings, speech-to-text, text-to-speech, and tool calling. NobodyWho generates the tool-calling grammar from your function signatures and constrains generation to it, so you pass plain functions and the output conforms to the expected structure without writing schemas by hand. Cactus takes OpenAI and MCP-style tool definitions, ships a vector index for retrieval, and provides Needle, a 26M-parameter model dedicated to tool calling.

## **Hardware acceleration**

Cactus is built around the mobile processor. Its kernels are hand-written in ARM NEON SIMD for the CPU, with Metal on Apple GPUs and the Apple Neural Engine for some vision models. Qualcomm, MediaTek, and Exynos NPU support is on its roadmap, not shipped. Cactus publishes per-device benchmarks in its README, listing tokens per second and peak RAM for named iPhone and Mac hardware.

NobodyWho takes a hardware-aware approach to acceleration, using Vulkan and Metal for GPU execution rather than targeting the NPU.  This is the sharpest hardware split between them. On older or low-end phones that lean on the CPU, Cactus's hand-written kernels are the advantage. On devices with a capable GPU, NobodyWho runs on the accelerator most platforms already expose.

## **Installation and first call**

NobodyWho installs through each ecosystem's own package manager: *pip install nobodywho* for Python, *flutter pub add nobodywho* for Flutter, *npm install react-native-nobodywho* for React Native, *ai.nobodywho:nobodywho* from Maven Central for Kotlin, Swift Package Manager for Swift, and the in-editor asset library for Godot. Each binding is a thin wrapper over one shared Rust core.

Cactus installs its engine by cloning the repository and running a setup script, then building the binding and downloading a model bundle:

```bash
git clone https://github.com/cactus-compute/cactus && cd cactus && source ./setup 
cactus build --python 
cactus download LiquidAI/LFM2-VL-450M
```

Cactus also publishes per-platform packages on pip, Maven, pub, and npm.

The difference carries into the first call. NobodyWho's Python API handles model loading and lifecycle for you, and returns the reply as a string:

```python
from nobodywho import Chat

chat = Chat("hf:NobodyWho/Qwen_Qwen3-0.6B-GGUF/Qwen_Qwen3-0.6B-Q4_K_M.gguf") 
response = chat.ask("What is the capital of Denmark?").completed() 
print(response)
```

Cactus's Python binding is a ctypes FFI over its C engine, with explicit model lifecycle and JSON message payloads:

```python
from cactus import ensure_model, cactus_init, cactus_complete, cactus_destroy
import json
 
bundle = ensure_model("LiquidAI/LFM2-VL-450M")
model = cactus_init(str(bundle), None, False)
messages = json.dumps([{"role": "user", "content": "What is the capital of Denmark?"}])
result = cactus_complete(model, messages, None, None, None)
print(result["response"])
cactus_destroy(model)
```

Both snippets are each project's own documented quick-start.

## **Platform support**

Cactus targets mobile and embedded. Its C and C++ core runs on wearables, smart-home devices, robots, and Raspberry Pi, with bindings for Flutter, React Native, Kotlin Multiplatform, Swift, Python, and Rust.

NobodyWho targets mobile, desktop (Linux, macOS, Windows), Python, and the JVM, and ships a binding for the [Godot game engine](https://docs.nobodywho.ooo/godot/).

Both engines cover phones and wearables, and Cactus reaches further into embedded hardware like robots and Raspberry Pi. Cactus also supports desktop deployment on macOS and ARM Linux. NobodyWho ships a Godot binding and targets desktop app runtimes across Linux, macOS, and Windows through its JVM and Python bindings. Cactus has no game-engine binding. Neither ships a browser or WebAssembly target. NobodyWho has an open GitHub issue tracking WASM export, and Cactus does not target the browser.

## **Cloud behaviour**

Both run inference locally by default. Cactus adds an optional cloud handoff that routes low-confidence queries to a hosted model. NobodyWho has no cloud router in the engine. In deployments that prohibit outbound network calls, NobodyWho has nothing to disable, and Cactus's handoff must be turned off and verified.

## **Licensing**

NobodyWho uses [EUPL-1.2](https://github.com/nobodywho-ooo/nobodywho), an OSI-approved open-source licence. It permits proprietary and commercial use with no revenue limit. The only obligation is that redistributing a modified version of the engine requires publishing those engine changes.

Cactus is source-available under its own licence. That [licence](https://github.com/cactus-compute/cactus/blob/main/LICENSE) grants free use to individuals, students, non-profits, and organizations with "Less than $2,000,000 USD in total funding" and "Less than $2,000,000 USD in gross annual revenue." An organization that does not meet those criteria "must obtain a separate commercial license," and a qualifying organization that later crosses either threshold has "thirty (30) days" to obtain one. Both licences were verified on 9 September 2026\. Cactus has revised its terms before, so check the current file before shipping a commercial product.

Both engines are free under those thresholds. Once a company crosses either one, Cactus requires a paid commercial licence and NobodyWho stays free.

## **Choosing between NobodyWho and Cactus**

The decision follows target hardware and commercial model.

| Requirement | Engine |
| :---- | :---- |
| Run any existing GGUF model with no conversion step | NobodyWho |
| In-house quantization tuned for on-device size and quality | Cactus |
| Hand-optimized CPU performance on ARM without a capable GPU | Cactus |
| Robotics, smart-home, or Raspberry Pi | Cactus |
| Desktop applications alongside mobile | NobodyWho |
| A model running locally inside a Godot game | NobodyWho |
| OSI open-source licence with no revenue ceiling | NobodyWho |

The two are different engines with different model formats, so the choice is set by where the model has to run and how the licence treats the product, not by a shared core. The [NobodyWho source and per-binding docs](https://github.com/nobodywho-ooo/nobodywho) list current platform and format support.