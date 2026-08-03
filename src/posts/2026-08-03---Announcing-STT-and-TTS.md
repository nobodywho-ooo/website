---
title: Announcing Speech To Text & Text To Speech
date: 2026-08-3
categories: ["Feature", "Release"]
description: "STT & TTS in NobodyWho — easily generate and transcribe audio!"
image: /assets/images/blog/2026/announcing-stt-tts/nobodywho-text-to-speech.png
slug: "announcing-stt-tts"
draft: true
---

![STT/TTS with NobodyWho](/assets/images/blog/2026/announcing-stt-tts/nobodywho-stt-tts.png)

Recently, we shipped speech support in NobodyWho! 🔊

We support both Text to Speech (TTS) and Speech to Text (STT), running through the same on-device inference engine you already use for language models.
On the TTS side, we support [Kokoro](https://kokorottsai.com/) and [Supertonic](https://github.com/supertone-inc/supertonic).
On the STT side, we support Whisper. All three run on top of ONNX Runtime, sharing the same accelerator and backend logic.

## **Why not llama.cpp?**

llama.cpp is built to support a wide range of autoregressive language model architectures.
Speech (notably TTS) has a different landscape with a mix of architectures that llama.cpp doesn't support.
Getting them supported isn't a matter of filing feature requests upstream either, since it would mean asking a project scoped around language models to take on an entirely different class of them.
If we wanted first-class speech support, we had to build the inference layer ourselves.

## **Why ONNX**

We considered three approaches.
We could wrap existing per-model implementations behind a common interface, we could use a Rust-native tensor library such as candle and implement each model's forward pass ourselves, or we could build on ONNX and let it handle inference and backend support for us.

We like [candle](https://github.com/huggingface/candle), and pure Rust is where we'd prefer to land.
But candle's accelerator coverage isn't yet where we need it to be, and backend support was the deciding factor.
ONNX, via the [ort](https://github.com/pykeio/ort) crate, gave us a Rust interface to a runtime that already covers most of the accelerators we rely on elsewhere in NobodyWho for text generation.

Backend support aside, wrapping per-model implementations directly would have left us dependent on upstream authors, or the community, to support new models as they're released.
Each project also makes its own dependency choices, which often mean pulling in various C or C++ libraries, which is something we prefer to avoid, since it complicates our build pipelines.

Building on a single runtime also lets us stay closer to actual upstream model behavior.
It enables us to write custom code, such as translating phonemes between the eSpeak and Misaki phoneme sets for Kokoro, where needed, in order to match the original implementation.

### The good

Outside of the ONNX runtime itself, our stack here is pure Rust: `misaki-rs` and `espeak-ng-rs` for phonemization, `hound` for audio I/O.

Adding a new architecture is also largely straightforward.
The ONNX file already describes the model, so most of the remaining work is accounting for whatever pre-processing the upstream implementation does.

### The bad

ONNX Runtime has no direct Metal backend.
Apple Silicon acceleration is only available through the CoreML execution provider.
That's a step down from the Metal support we already offer for text generation elsewhere in NobodyWho.
Also, ONNX does not ship binaries for Android, we need to compile them from scratch in our build pipelines, which slows it down a bit.

**What's next**

This is the first release of speech support in NobodyWho, and we intend to keep building on it.
If you run into issues, have feedback, or there is a specific model you would like to be supported, open an issue on GitHub.
If you're already building with NobodyWho, we'd love to see what you make with speech!

