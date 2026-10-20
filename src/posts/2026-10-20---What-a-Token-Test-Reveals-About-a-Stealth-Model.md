---
title: What a Token Test Reveals About a Stealth Model
date: 2026-10-20
author: Pierre Bresson
categories: ["Technical"]
description: "Two short probes and an API token count can show which tokenizer sits behind a stealth model, but not which model it is."
slug: "what-a-token-test-reveals-about-a-stealth-model"
hideInBlog: true
---

Cat Jam Free was a stealth model that OpenCode [added to its model docs](https://github.com/anomalyco/opencode/pull/55029) on 13 October 2026, free for a limited time and with no maker named. On 16 October OpenCode [renamed it Beam Free](https://github.com/anomalyco/opencode/pull/55993) and dropped the stealth model label, still without naming the maker.

People on X tried to guess the maker, and they didn’t agree. [@notjazii](https://x.com/notjazii/status/2110300507008827513) says it “looks like qwen finetune”, while [@yuhasbeentaken](https://x.com/yuhasbeentaken/status/2110257005071925737) says “its tokenizer appears to match mimo exactly”.

Both guesses fit the same evidence. Two of Xiaomi’s MiMo models ship the exact same vocab and merge files as Qwen2.5, so any test based on those files gives the same answer for both.

## How the Test Works

Tokenizers from different families split some strings differently, and a couple of short probes make the difference easy to spot:

* **Special tokens.** Qwen2 treats `<|im_start|>` as a single token (ID 151644), while tokenizers that don’t have it split the string into 6 or 7 pieces.

* **Digits.** Qwen2 gives every digit its own token, so 1234567890 comes out as 10 tokens. Llama 3 groups digits in threes, so the same number is only 4 tokens: 123, 456, 789 and 0\.

Here’s how four tokenizers handle both probes, using the vocab files llama.cpp ships for its tests (built from Qwen1.5-7B, Meta-Llama-3-8B, deepseek-llm-7b-base and Phi-3-mini):

| Probe | Qwen2 | Llama 3 | DeepSeek LLM | Phi-3 |
| :---- | :---- | :---- | :---- | :---- |
| `<\|im_start\|>` | 1 | 6 | 6 | 7 |
| 1234567890 | 10 | 4 | 10 | 10 |

One probe isn’t always enough. DeepSeek LLM and Phi-3 also split digits one at a time, so the digit probe can’t separate them from Qwen2. The special-token probe can, but only if the API parses special tokens in user messages.

## Measure It Through an API

You don’t need the tokenizer itself to run these probes. OpenAI-compatible APIs can return `usage.prompt_tokens` with each response ([OpenAI reference](https://developers.openai.com/api/reference/resources/chat)), so the count can be measured from outside. The script below sends a short message, sends it again with a probe added, and prints the difference.

The chat template is identical in both requests, so its tokens are cancelled out in every test run for this post. Each probe goes after the letter x, which is also how the table above was counted.

```
# token_probe.py: count how a chat API tokenizes a few probe strings.
# Usage: python token_probe.py URL [API_KEY] [MODEL]
import json, sys, urllib.request
 
URL = sys.argv[1]  # an OpenAI-compatible /v1/chat/completions endpoint
KEY = sys.argv[2] if len(sys.argv) > 2 else ""
MODEL = sys.argv[3] if len(sys.argv) > 3 else ""
PROBES = ["1234567890", "<|im_start|>", "<|begin_of_text|>"]
 
def prompt_tokens(text):
    body = {"model": MODEL, "max_tokens": 1,
            "messages": [{"role": "user", "content": text}]}
    req = urllib.request.Request(URL, json.dumps(body).encode(), {
        "Content-Type": "application/json", "Authorization": f"Bearer {KEY}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)["usage"]["prompt_tokens"]
 
base = prompt_tokens("x")
for p in PROBES:
    print(f"{p!r} -> {prompt_tokens('x' + p) - base}")
```

Usage:

```
python token_probe.py https://<host>/v1/chat/completions <api-key> <model>
```

Here’s the output against a local llama.cpp server using the Qwen2 tokenizer:

```
'1234567890' -> 10
'<|im_start|>' -> 1
'<|begin_of_text|>' -> 7
```

And against one using the Llama 3 tokenizer:

```
'1234567890' -> 4
'<|im_start|>' -> 6
'<|begin_of_text|>' -> 1
```

The first two lines match the table. The third probe, `<|begin_of_text|>`, is Llama 3’s start token, so the result flips: it’s one token on Llama 3 and seven on Qwen2.

## What the Result Tells You

* A match tells you which tokenizer is behind the endpoint. It can’t tell you which model, because any model built on that tokenizer gives the same numbers.

* Labs do reuse tokenizers. Xiaomi’s [MiMo-7B-Base](https://huggingface.co/XiaomiMiMo/MiMo-7B-Base/tree/main) and [MiMo-V2.6-Flash-RL](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Flash-RL/tree/main) ship the same `vocab.json` and `merges.txt` as [Qwen2.5-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct/tree/main), and all three put `<|im_start|>` at ID 151644.

* If an API escapes special tokens in user messages, Qwen2 counts `<|im_start|>` as 6 tokens, the same as Llama 3. The digit probe still tells those two apart.

* If an API doesn’t return usage at all, the script fails with an error.

---

OpenCode does sometimes reveal a stealth model. On 19 October it [renamed Space Bunny Free](https://github.com/anomalyco/opencode/pull/57021), which it had listed as a stealth model, to MiniMax M3.1 Flash Free. If Beam Free gets a name too, the probes above can check whether that model’s tokenizer matches what the endpoint returns.

This post follows [When Chat Templates Go Wrong](https://www.nobodywho.ai/posts/when-chat-templates-go-wrong/), which covers what happens when a GGUF model’s chat template doesn’t match what the engine expects.

Every token count in this post came from llama.cpp, which also powers [NobodyWho](https://github.com/nobodywho-ooo/nobodywho).

