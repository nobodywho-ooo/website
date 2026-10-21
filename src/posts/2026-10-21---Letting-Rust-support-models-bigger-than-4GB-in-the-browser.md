---
title: Letting Rust support models bigger than 4GB in the browser
date: 2026-10-21
author: Albert Garde
categories: ["Technical"]
description: "wasm32 caps memory at 4 GB, too small for most language models. Here’s how we’re adding a wasm64 Emscripten target to Rust upstream, a big milestone toward running NobodyWho in the browser."
slug: "letting-rust-support-models-bigger-than-4GB-in-the-browser"
---

At NobodyWho we aim to make language models run everywhere. We already have support for mobile and desktop apps, the Godot game engine, and even the Apple Watch. Nowadays though, most of the software people use isn't desktop apps running directly on their architecture of choice, but instead running in a browser on some website. It's therefore a huge hole in our promise that we don't support running language models in the browser. We know that, which is part of why we recently started work on adding WASM support to our library.

One thing that most people know about large language models is that they are, well, large, with even the "small" language models that NobodyWho specializes in providing easily taking many GB. This is a problem when wasm32 has a hard cap of 4 GB memory . Luckily we have wasm64 to save us. Great news is that Rust does support a `wasm64` target. Bad news is, it doesn't support a `wasm64`+ Emscripten target.

|  | `unknown` (no C interop) | `emscripten` (C/C++ interop) |
| --- | --- | --- |
| **wasm32** (4 GB cap) | ✅ `wasm32-unknown-unknown` | ✅ `wasm32-unknown-emscripten` |
| **wasm64** (Memory64) | ✅ `wasm64-unknown-unknown` | ❌ missing |

The most straightforward way to fix this would be to create a custom target and use that, but of course Rust is open source, so we can fix it at the source and others can benefit as well. One issue was that a lot of the Rust standard library assumes that the only non-`unknown` wasm target was 32-bit. The Rust compiler has a fair bit of conditional compilation conditional on whether the target is wasm or not, but most of it just checked for `target_arch="wasm32"` instead of wasm targets in general so first step was fixing that by replacing `target_arch="wasm32"` with `target_family="wasm"` ([PR](https://github.com/rust-lang/rust/pull/163794)).

Next step is actually creating the target. We have a [PR](https://github.com/rust-lang/rust/pull/163808) for this active in the Rust repo, but it'll probably take some time for this to get merged, and even longer before it lands in stable.

Of course all of this still requires us to get NobodyWho to run in WASM, which both requires large changes in our own library and more upstream work, which we are making [progress](https://github.com/pykeio/ort/pull/663) on. Even after that there's the exciting problem of figuring out how to make this *useful*. Figuring out problems like getting the models to the user's machine (even a small half GB model can be a lot to download while on a website), and how to make them run reasonably fast.

**Want to run LLMs in the browser?** Star and watch [NobodyWho on GitHub](https://github.com/nobodywho-ooo/nobodywho) to get notified when WebAssembly support drops!