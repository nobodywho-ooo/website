---
title: "LFM3 fits in 1 GB. Read the licence before you ship it"
date: 2026-10-29
author: Pierre Bresson
categories: ["Technical"]
description: "Liquid AI's LFM3-1.7B fits in about 1 GB. Before you ship it, check that your engine knows the lfm3 architecture and that the licence's revenue line doesn't apply to you."
slug: "lfm3-fits-in-1-gb-read-the-licence-before-you-ship-it"
hideInBlog: true
---

Liquid AI [released LFM3](https://www.liquid.ai/blog/lfm3) on 27 October. The text model, LFM3-1.7B, “fits in about 1 GB at 4-bit precision” and has a 256K context window, and Liquid lists two phones, the Samsung Galaxy S26 Ultra and the OnePlus 15, among the devices it tested on. The [official GGUF repo](https://huggingface.co/LiquidAI/LFM3-1.7B-GGUF) also ships a 1.05 GB Q4_0 file built with quantization-aware distillation, which the model card says “was trained to recover the accuracy lost to Q4_0 quantization.”

Liquid’s own numbers are strong. It says LFM3-1.7B decodes 1.8 to 2.8 times faster than the next model and beats Qwen3.5-9B on long tasks in browsers and business apps, and it is upfront that “larger models still win on agentic coding and knowledge.” These are first-party benchmarks, so they deserve the usual caution, but a 1 GB model with those claims is the kind people drop into an app the same afternoon. Two things deserve a check first, and neither is on the benchmark chart.

## The engine has to know the architecture

LFM3 is a new architecture, and its GGUF header says so: `general.architecture` is `lfm3`. An engine can only load a GGUF whose architecture its llama.cpp build knows, and the model card says LFM3 needs llama.cpp b11960 (v0.8.0) or newer. Any app that bundles an older build will fail to load the file, however small it is.

This applies to every engine built on llama.cpp, because each one ships its own copy. NobodyWho [moved to llama.cpp v0.8.0](https://github.com/nobodywho-ooo/nobodywho/pull/848) on 28 October, the day after the release, to add LFM3 support.

## The licence has a revenue line

LFM3 ships under the LFM Open License v1.0, and the [LICENSE file](https://huggingface.co/LiquidAI/LFM3-1.7B-GGUF/blob/main/LICENSE) in the repo is short enough to read in a few minutes. The part that matters for an app is Section 5. Commercial use is licensed only while “You or Your Legal Entity” stays below a threshold of “annual revenue of 10 million United States dollars ($10,000,000) or more”, and any commercial use above it “is not licensed under this Agreement.”

Two definitions decide whether that line applies to you. Commercial use covers “direct or indirect commercial advantage”, so a free app that supports a paid business can still count. The legal entity includes every company that controls you or that you control, with control set at 50% ownership, so a small team inside a large group is measured by the group’s revenue. Below the line, the main obligation is to give anyone you distribute the model to a copy of the licence, which in practice means shipping the LICENSE file with your app.

The engine licence is the other half. NobodyWho is licensed under the EUPL-1.2, which has no revenue or funding limit, so with LFM3 the model licence is the one that sets the terms.

## Check both before you ship

Both checks fit in a few lines of Python. The script downloads the file, reads the architecture and any licence name from the GGUF header, and then loads it:

```python
from gguf import GGUFReader
from nobodywho import Chat, download_model

MODEL = "huggingface:LiquidAI/LFM3-1.7B-GGUF/LFM3-1.7B-QAD-Q4_0.gguf"
path = download_model(MODEL)

reader = GGUFReader(path)

def field(key):
    f = reader.get_field(key)
    return f.contents() if f else "not set"

# The architecture your engine's llama.cpp build has to support.
print("architecture:", field("general.architecture"))
# Some converters record a licence name. The terms are in the repo's LICENSE file.
print("licence:", field("general.license"))

chat = Chat(path)  # needs a NobodyWho version with LFM3 support (llama.cpp v0.8.0 or newer)
print(chat.ask("Explain what a GGUF file is in one sentence.").completed())
```

Install both packages with `pip install gguf nobodywho`. The header tells you what the engine needs, and the LICENSE file in the same repo tells you what you are allowed to do with the model.

NobodyWho runs GGUF models locally and offline, with bindings for Python, Flutter, React Native, Swift, Kotlin and Godot. If you want one less licence to read twice, [star NobodyWho on GitHub](https://github.com/nobodywho-ooo/nobodywho).
