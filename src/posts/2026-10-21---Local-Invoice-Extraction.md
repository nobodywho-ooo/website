---
title: Your invoices don't need to leave the building
date: 2026-10-21
author: Duarte O.Carmo
categories: ["Technical"]
description: "Qwen3.5-0.8B on NobodyWho vs. Claude Haiku 4.5, reading the same invoice."
slug: "local-invoice-extraction"
---


For a non-technical audience, it's hard to grasp the value of open models. Or should we say private models? 

The best way of demonstrating value is to start with a very practical use case. That's what we presented on one of our latest demos. Extracting structured information from invoices. That's a problem a lot of companies have - right? 

<video src="/assets/videos/blog/2026/local-invoice-extraction/invoice-demo.mp4" width="1440" height="900" autoplay loop muted playsinline style="border-radius: 12px;" aria-label="Qwen3.5-0.8B running locally with NobodyWho and Claude Haiku 4.5 read the same invoice. The local model finishes 3.2 times faster.">
  Qwen3.5-0.8B running locally with NobodyWho and Claude Haiku 4.5 read the same invoice. The local model finishes 3.2 times faster.
</video>    

For this quick demo we went with a super straightforward task. [5 invoices](https://huggingface.co/datasets/mathieu1256/FATURA2-invoices), and a single goal: Extract structured information from them. We put [Qwen 3.5 0.8B](https://huggingface.co/NobodyWho/Qwen_Qwen3.5-0.8B-GGUF) vs. Anthropic's [Haiku](https://www.anthropic.com/claude/haiku) model. 

The results are surprising. Not only is the local model 3x faster on average. It also costs a total of 0 EUR. All while keeping your data 100% private. And everything is powered by [NobodyWho](https://github.com/nobodywho-ooo/nobodywho). 

If you want to run the demo yourself, it's just a couple of commands, and the code is [right here](https://github.com/nobodywho-ooo/nobodywho-invoice-demo). 

