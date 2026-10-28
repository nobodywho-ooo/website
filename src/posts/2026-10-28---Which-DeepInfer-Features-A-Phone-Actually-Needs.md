---
title: Which DeepInfer features a phone actually needs
date: 2026-10-28
author: Pierre Bresson
categories: ["Technical"]
description: "DeepSeek open-sourced DeepInfer, its serving framework for V4.1 Flash. Which of its features matter when a model runs for one person on their own device?"
slug: "which-deepinfer-features-a-phone-actually-needs"
hideInBlog: true
---

DeepSeek has open-sourced [DeepInfer](https://github.com/deepseek-ai/DeepInfer), the inference framework behind its production service for DeepSeek-V4.1-Flash. The README describes this release as offline inference “with the core features needed for serving at scale”, and it supports a single model on NVIDIA SM100 GPUs and Huawei Ascend 950 NPUs.

We build [NobodyWho](https://github.com/nobodywho-ooo/nobodywho), which runs GGUF models on phones and laptops through llama.cpp, so we read DeepInfer’s feature list with one question in mind: which of these features does an app need when it runs a model for one person on their own device? Several of them exist mainly for servers that handle many people’s requests at once.

## Features built for a shared server

The parallelism line in the README reads `Attention DP / balanced CP, MoE EP + EPLB`. DeepSeek’s [deployment Q&A](https://github.com/deepseek-ai/DeepInfer/blob/main/doc/inference_deployment_qa.md) explains why expert parallelism is there: spreading the MoE experts across a node or supernode “increases batch size and GPU matrix-multiplication efficiency, and therefore throughput”, and EPLB balances the load across the GPUs that hold the experts. On a phone the model runs on a single device, so there is nothing to split across GPUs and nothing to balance.

Batch-invariant inference keeps “model results identical across different batch compositions”. DeepInfer needs it for deterministic sampling, together with a fixed seed and with DSpark’s variable-length verification turned off, and both features are NVIDIA-only in this release. vLLM also ships batch invariance as a beta feature behind [`VLLM_BATCH_INVARIANT=1`](https://docs.vllm.ai/en/latest/features/batch_invariance/), and its docs say it makes a model’s output “independent of the batch size or the order of requests in a batch”. On a shared server, other people’s traffic decides what ends up in the batch next to your request. On one person’s phone, nobody else’s requests can.

## Features a phone does use

DeepInfer’s list opens with optimized kernels, which every engine needs, and NobodyWho gets its kernels from llama.cpp. Speculative decoding and structured outputs matter on a phone as well. DeepInfer’s speculative decoding is called DSpark, and it drafts tokens and uses confidence estimates to decide how many of them to verify. NobodyWho supports [MTP speculative decoding](https://docs.nobodywho.ooo/docs/llm-basics/) for models with MTP draft heads, such as Gemma 4, whose heads come in a separate GGUF file. [Its docs](https://docs.nobodywho.ooo/python/chat/) warn that MTP can hurt performance on Apple Silicon and on high-entropy text like creative prose, so benchmark it before you turn it on.

DeepInfer constrains generation to a regex, a JSON schema or an EBNF grammar. NobodyWho [does the same](https://docs.nobodywho.ooo/python/sampling/) with a regex, a JSON schema, or a custom grammar written in Lark or GBNF, and its tool calling builds the grammar from each tool’s schema, which most bindings derive from your function signatures. Reproducible output matters on a device too, and NobodyWho samples with a fixed default seed, so output repeats even if you never set one.

## How DeepSeek keeps its KV cache

Retaining KV cache for more than 72 hours is one of the three design goals in DeepSeek’s deployment Q&A, so that a cache hit cuts repeated prefill work. According to the Q&A, the 3FS file system provides roughly 100 PiB of SSD storage for that cache, with a time-to-live of 3 days for agent traffic and 7 days for chatbot traffic.

The KV cache system itself is not in this release. The README lists it, along with prefill/decode disaggregation and load balancing across data-parallel replicas, as required for a complete service but not included, and adds that most of the engine side of disaggregation is already implemented.

A phone has no 100 PiB storage tier, and one person’s conversation does not need one. NobodyWho keeps the open conversation’s KV cache in memory, and it reuses the part of the cache that each new prompt shares with the previous one and only processes what comes after it. Recurrent and hybrid models fall back to a checkpoint only when earlier history changes, so adding a new turn reuses the cache with every model.