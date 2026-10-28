---
title: "Fits vs runs: V4.1 Flash on 12 GB of VRAM"
date: 2026-10-28
author: Pierre Bresson
categories: ["Technical"]
description: "Memory capacity decides whether DeepSeek V4.1 Flash fits on 12 GB of VRAM and 64 GB of RAM, and bandwidth decides how fast it runs. The same arithmetic on a phone."
slug: "fits-vs-runs-v4-1-flash-on-12-gb-of-vram"
hideInBlog: true
---

A thread on r/LocalLLM asks whether DeepSeek V4.1 Flash 1017 will run on a machine with 12 GB of VRAM and 64 GB of RAM. The commenters think it might load if the weights spill over onto an NVMe drive, and they estimate around 3 tokens a second. Both halves of that answer come from two pieces of arithmetic, and the same arithmetic tells you what will run on a phone.

## Two numbers decide it

Memory capacity decides whether a model fits, because the weights have to sit somewhere fast enough to read from. Memory bandwidth decides how fast it runs, because generating a token means reading every active weight once, so the ceiling on speed is the bandwidth divided by the bytes read per token. For a mixture-of-experts model these two use different parameter counts: total parameters decide the fit, and active parameters decide the speed.

According to [DeepSeek’s paper](https://arxiv.org/abs/2609.19969), V4.1 Flash has a 552B-parameter backbone and activates 8B parameters per token during prefill and 16B during decode. [NVIDIA’s model card](https://build.nvidia.com/deepseek-ai/deepseek-v4.1-flash/modelcard) also lists a 196B-parameter Engram conditional memory. Generating text is decode, so 16B is the number that sets the speed.

## Does it fit?

The smallest GGUF in [Unsloth’s guide](https://unsloth.ai/docs/models/deepseek-v4.1-flash) is UD-IQ1_S at 233.0 GB. Of that, 110.6 GB is the Engram table, and the model reads only a few of its rows per token, so the table can stay on the SSD while the operating system loads rows as they are needed. That leaves 122.4 GB of other weights, which Unsloth gives as the absolute minimum amount of RAM and VRAM, and its hardware table lists 128 to 145 GB for the 1-bit quants.

The machine in the thread has 12 GiB plus 64 GiB, which is 81.6 GB in the decimal units Unsloth uses. Even if every byte were free, about 41 GB of those weights would have to stay on the NVMe drive, and the operating system and the context cache push that higher. llama.cpp can memory-map a file larger than RAM, so the model may start, but the machine is well below Unsloth’s minimum and the model does not fit.

## How fast can it run?

Spread over the 552B backbone parameters, those 122.4 GB average about 1.8 bits each. At that rate, the 16B parameters active during decode come to about 3.5 GB read for every generated token. If all of that sat in dual-channel DDR5-6400, the top speed Intel lists for its [Core Ultra 9 285K](https://www.intel.com/content/www/us/en/products/sku/241060/intel-core-ultra-9-processor-285k-36m-cache-up-to-5-70-ghz/specifications.html), the bandwidth would be 102.4 GB/s and the ceiling would be about 29 tokens a second.

On the machine in the thread, at least a third of the weights live on the NVMe drive. If the active experts are spread evenly, about 1.2 GB of every token comes from disk, and a fast PCIe 4.0 drive like [Samsung’s 990 Pro](https://www.samsung.com/nz/memory-storage/nvme-ssd/990-pro-2tb-nvme-pcie-gen-4-mz-v9p2t0bw/) reads at up to 7,450 MB/s sequentially. If the disk reads and the RAM reads happen one after the other, which is a rough model of how llama.cpp pages weights in from a memory-mapped file, each token takes about 0.18 seconds, which caps the machine at about 5.5 tokens a second.

These are rough ceilings. They treat every weight as stored at the average 1.8 bits, and they read the 12 GB on the GPU at RAM speed, which lowers the result by about 0.1 tokens a second at most. They also leave out KV cache reads, the few Engram rows that come off the SSD for each token, and the fact that expert lookups are scattered reads, which run slower than the drive’s sequential figure. A real run will land below the ceiling, so the commenters’ 3 tokens a second is possible, although scattered reads could pull it well under that.

The thread also quotes 4.25 bits per weight. That figure matches MXFP4, the 4-bit format DeepSeek uses for the expert weights. [The OCP spec](https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf) defines MXFP4 as 4-bit values with one 8-bit scale for every 32 of them, so each weight costs 4.25 bits. [The official release](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) averages more than that, because DeepSeek keeps the other weights in FP8 and BF16.

## The same arithmetic on a phone

[NobodyWho’s README](https://github.com/nobodywho-ooo/nobodywho#mobile) sets the Android floor at a Snapdragon 855 with 6 GB of RAM. It says a device needs roughly twice the model file size in available RAM, and that models under 1 GB tend to run smoothly on any phone. Qualcomm specifies the 855’s memory as [4×16-bit LPDDR4X at 2133 MHz](https://www.cnx-software.com/2018/12/06/qualcomm-snapdragon-855-specifications-published/), which works out to 34.1 GB/s.

[Qwen3 0.6B at Q4_K_M](https://huggingface.co/NobodyWho/Qwen_Qwen3-0.6B-GGUF/blob/main/Qwen_Qwen3-0.6B-Q4_K_M.gguf) is a 484 MB file, so it needs about 1 GB of available RAM, which a 6 GB phone should still have after Android reserves its 2 to 4 GB. It is a dense model, so every weight is read for each token, and the ceiling is 34.1 GB/s divided by 0.484 GB, about 70 tokens a second. V4.1 Flash’s smallest file is 233 GB, which is far beyond any phone.

NobodyWho can also pick a model that fits for you. If you pass `"auto"` as the model, it [adds free RAM to the free memory of a dedicated GPU, if there is one](https://github.com/nobodywho-ooo/nobodywho/blob/main/nobodywho/core/src/memory.rs), caps that at three quarters of total RAM plus VRAM, and picks the model on its built-in list with the highest memory threshold at or below that figure, falling back to Qwen3 0.6B.