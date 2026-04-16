---
title: Notes on "Friends Don't Let Friends Use Ollama"
date: 2026-04-16
categories: ["ollama", "open-source"]
description: "A brief commentary on Zetaphor's blog post, open-source citizenship, and how NobodyWho avoids Ollama's mistakes."
slug: "notes-on-friends-dont-let-friends-use-ollama"
---

# Notes on "Friends Don't Let Friends Use Ollama"

[This blog post](https://sleepingrobots.com/dreams/stop-using-ollama/) by Zetaphor has been making the rounds, and it has got me thinking about how we deal with being good stewards of the open source commons in NobodyWho.

This is just a brief commentary on each of the things that Zetaphor brings up, with a perspective on how each of these apply to NobodyWho.


## "A llama.cpp Wrapper With Amnesia"

Ollama have tried to hide that their inference engine is actually llama.cpp wrapped in a Go server.

We make no such attempts in NobodyWho. The very top of our [README](https://github.com/nobodywho-ooo/nobodywho/blob/f81d6f41c1578d9484f1f3b313a9c8b94f1d0ac6/README.md) describes that llama.cpp does the heavy lifting for LLM inference, along with a link to the upstream repo. We're proud to be using llama.cpp, as the absolute best portable inference engine for end-user devices.


## "The Fork That Made Things Worse"

About a year ago, Ollama forked llama.cpp, building their own thing on top of the bits and pieces that they like.

NobodyWho does the opposite: we have gotten 30+ PRs merged in upstream projects.
Most of them are to [utilityai/llama-cpp-rs](https://github.com/utilityai/llama-cpp-rs/), a low-level libllama.a wrapper for Rust, but there's also a handful in llama.cpp upstream, a few across minijinja, nixpkgs, a gbnf library crate, and other small projects.

Working with the upstream does mean that we spend extra effort making the code fit the standards of the relevant upstream, but it also lets us much more easily integrate the improvements made by other contributors, and working in the code reviews from e.g. llama.cpp maintainers genuinely does improve the overall code quality.

Maintaining things together, in the commons, is better for everybody.


## "The Registry Bottleneck", "The Modelfile: Reinventing a Solved Problem" and "Misleading Model Naming" 

These three sections all have the same root cause:
Ollama are running their own model hub, which hosts models in their own format.
This is a clear play for vendor lock-in, as opposed to collaborative interoperability.

The Ollama file format is an OCI container, where one of the layers is a GGUF file,
another layer is a json file with sampler configuration, and a third layer is the chat template, translated from the upstream jinja templates into the Go template language.
As Zetaphor points out, there is literally no reason for any of this to exist, since GGUF is already an extensible file format with support for arbitrary extra metadata.

We believe strongly in open standards and interoperability, and would much rather work on improving the GGUF spec, than clobbering a pile of extra files around it. At the AI Plumbers Conference in Bruxelles this year, we led a small workshop about discussing what's still missing from the GGUF standard, and what the options for extending it are.

All this is just to say, that we are doubling down on the existing standard, rather than having a "not invented here" attitude. NobodyWho just uses plain GGUF files, we run the upstream chat templates from the GGUF metadata, and apply the sampler config as declared in the GGUF.

We're not trying to be a model hub, HuggingFace is already doing a pretty good job of that. For that reason, we're also putting out a feature that lets you download normal GGUF files from huggingface directly. Let's not reinvent the wheel for no reason.


## "The Cloud Pivot"

According to Zetaphor's post, Ollama may route data to third-party inference servers running proprietary models, via their "Ollama Cloud" service, and makes no guarantees about how the data is processed by the third party.

At NobodyWho, we don't care much about server inference.
We have a dedicated focus on running models on end-user devices: your smartphone and your laptop. A typical deployment is single-user (one phone, one human), and runs entirely offline, on-device, and in the main process of your application.
Routing your data to a third party is something that you can do transparently (and semi-covertly) if your focus is to run LLM servers. Our focus is to do inference locally and offline, so this doesn't apply to us.


## In Conclusion

The criticisms that Zetaphor presents in their blog post generally fall into two categories:

**The first category** is about being poor stewards of the open source ecosystem:

- Failing to provide attribution to llama.cpp
- Forking the code rather than contributing to their maintenance
- and arbitrarily making up new standards in-house, to cultivate dependence

We do none of that:

- Llama.cpp is front-and-center in the presentation of NobodyWho
- We regularly contribute to the foundational libraries
- We put in the work to iterate on the common standard for everybody, rather than suffering from NIH syndrome.
- Interoperability with the predominant standards is a core feature of our library.

**The second category** of criticisms generally doesn't apply to NobodyWho, because we're just trying to solve a different set of problems than Ollama.

Ollama are trying to be a model hub and cloud inference provider.
NobodyWho is an interoperable, offline inference library for normal end-user devices.

We don't suffer from the problems that come with trying to replace the existing standard, because we prefer to work with the existing standards. You can just run new GGUFs as they come out.
We don't have the trust problems of Ollama. NobodyWho is made to do inference offline, so you can keep your conversation data to yourself.
By scoping differently, we just avoid a large set of problems.

> This post was written by a human. No words were made up by the machine.
