---
title: "Your 2-bit model agrees with the API 90% of the time. Is that good?"
date: 2026-10-29
author: Pierre Bresson
categories: ["Technical"]
description: "Top-token agreement is a better way to judge a quant than file size. What 90% means next to llama.cpp's published numbers, and how to measure the quant you ship."
slug: "your-2-bit-model-agrees-with-the-api-90-of-the-time"
hideInBlog: true
---

A post on [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1xh9yf7/deepseekv41flash1017_at_41_toks_on_one_3090/) runs DeepSeek-V4.1-Flash-1017 at 2-bit on a single RTX 3090 with 192 GB of RAM, and backs up the quality with one number. The poster reports that the quantized model picks the same next token as DeepSeek’s own API 90.2% of the time on general text and 92.4% on code and math.

That is a better way to judge a quant than file size or a vibe check, and llama.cpp already measures it. The harder question is what 90% means, and the answer depends on what you compare it with.

## What the number measures

llama.cpp’s [perplexity tool](https://github.com/ggml-org/llama.cpp/blob/master/tools/perplexity/README.md) has a KL divergence mode. It first records the logits of the full-precision model over a text, then runs the quantized model over the same text and compares the two token by token. One of the statistics it prints is “Same top p”, which the README defines as the “percentage of how often the token was assigned the highest probabilities by both models.” That is the same idea as the Reddit figure: how often the quant would have picked the token the full model picked.

It also prints the mean KL divergence, which measures how far apart the two probability distributions are, with 0 meaning identical. Top-token agreement is the easier number to explain, and KL divergence catches changes in the tokens that were not the top pick.

## What good looks like

The [llama.cpp README](https://github.com/ggml-org/llama.cpp/blob/master/tools/perplexity/README.md) publishes both statistics for Llama 2 7B and Llama 3 8B at several quant levels. For Llama 3 8B, Q8_0 agrees with the 16-bit model on the top token 97.7% of the time, Q6_K 96.0%, Q4_K_M 91.9% and Q2_K 71.1%. For Llama 2 7B the same levels give 98.8%, 97.5%, 94.7% and 85.6%.

Set against that table, a 2-bit model at 90% sits next to a 4-bit Llama 3 8B, which is a strong result for 2 bits. The two numbers are not measured the same way, though. The Reddit figure compares against the API’s answers to the poster’s prompts, while llama.cpp compares against the full model’s logits on Wikitext-2, so treat the comparison as a rough guide.

The table has a second lesson. Llama 3 8B lost more agreement than Llama 2 7B at every quant level, so a newer model does not automatically survive quantization better than an older one. Some vendors now train for it directly, like the [quantization-aware Q4_0](https://huggingface.co/LiquidAI/LFM3-1.7B-GGUF) that Liquid ships for LFM3, but the only way to know for your model is to measure it.

## Run it on the model you ship

On a phone the model is usually a small one at 4-bit, which is exactly where the table shows agreement starting to drop. NobodyWho’s Hugging Face repo for [Qwen3.5 0.8B](https://huggingface.co/NobodyWho/Qwen_Qwen3.5-0.8B-GGUF) has BF16, Q8_0 and Q4_K_M files, so you can compare the quant you plan to ship against the full-precision file with two llama.cpp commands:

```bash
# Get the Wikitext-2 test set with the script that ships with llama.cpp
./scripts/get-wikitext-2.sh

REPO=NobodyWho/Qwen_Qwen3.5-0.8B-GGUF

# 1. Record the full-precision model's logits (--chunks keeps the file small)
llama-perplexity --hf-repo $REPO --hf-file Qwen_Qwen3.5-0.8B-BF16-vendor-sampling.gguf \
  -f wikitext-2-raw/wiki.test.raw --chunks 20 --kl-divergence-base qwen35-bf16.kld

# 2. Compare the quant you plan to ship against those logits
llama-perplexity --hf-repo $REPO --hf-file Qwen_Qwen3.5-0.8B-Q4_K_M-vendor-sampling.gguf \
  --kl-divergence-base qwen35-bf16.kld --kl-divergence
```

Read “Same top p” and “Mean KLD” in the output, then run step 2 again with the Q8_0 file. We ran exactly these commands on a two-core cloud machine. The Q4_K_M file agreed with BF16 on the top token 89.8% of the time, with a mean KL divergence of 0.034, and the Q8_0 file agreed 97.8% of the time, with 0.0013. The extra 280 MB of Q8_0 buys back eight points of agreement, and the 4-bit file of this 0.8B model lands close to the 90% from the Reddit post, though the two were measured differently.

The logits file is the part to watch. At 20 chunks it came to 2.5 GB, and the first command took about three minutes, including the download. The README says it reaches 37 GiB for Llama 3 over the full Wikitext-2 test set, so keep `--chunks` for a first run.

Wikitext-2 is the convention for comparing numbers with other people. For the decision itself, record the logits on text that looks like what your app will see, such as support chats or form fields, because a quant can hold up on Wikipedia prose and slip on your domain.

NobodyWho runs GGUF models locally and offline, with bindings for Python, Flutter, React Native, Swift, Kotlin and Godot, and the quant you measure here is the same file it loads. If you want to ship the quant you measured, [star NobodyWho on GitHub](https://github.com/nobodywho-ooo/nobodywho).
