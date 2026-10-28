---
title: "(How) Can LLMs run in the browser?"
date: 2026-10-28
author: Albert Garde
categories: ["Technical"]
description: "WASM targets, GPU backends, extensions vs. websites, and browser support: what it actually takes to run an LLM in the browser."
slug: "how-do-llms-run-in-the-browser"
---

A big push here at NobodyWho is to get language models running in the browser using WebAssembly. 

After working on it for a few weeks we’ve gotten a good idea of the landscape.
One thing that’s very clear, and this will come as a surprise, is that browsers are actually kinda complicated.

First, we use Rust at NobodyWho, and there are (at least) three different compilation targets for Rust for WASM: Emscripten, WASI, and `wasm32-unknown-unknown` with `wasm-bindgen`.
All with different levels of support in various dependencies and within Rust itself. 

Second, there are (at least) three different hardware backends: CPU, WebGPU, and WebNN, with the last two being the only reasonably fast ones and both being very new or experimental.

Third, there’s the question of whether the LLM will be running in a website or a browser extension.

Fourth, and importantly, there are many different browsers and many different browser versions.
Many of the features needed for running LLMs in a browser are relatively new, and browser support can be spotty, especially if your users haven’t updated for a while.

## Spoiled for choice

Fortunately, many of these dimensions can get flattened by technical constraints or a specific use case.

At NobodyWho we use both llama.cpp and the ONNX Runtime as inference engines, and they both assume a system library.
That’s an issue for `wasm-bindgen`, since the second `unknown` in `wasm32-unknown-unknown` means “unknown OS”, i.e. no system library.
This leaves WASI and Emscripten, with Emscripten being the obvious choice given that WASI in the browser is… experimental[^wasi-experimental].

The story for hardware backends is just as clear: run with WebGPU when available and fall back to CPU when WebGPU isn’t available (or when on Firefox, since apparently GPU is [slower](https://github.com/ngxson/wllama/issues/296) there).
Why not WebNN? Again because it’s… experimental[^webnn-experimental].

At NobodyWho we're focusing on running LLMs in a website rather than a browser extension, since that's what we have a use case for, but there are some interesting tradeoffs between the two.
A big issue with running an LLM in the browser is that useful models are _big_.
Even the small models are typically a few hundred MB, which is much more than a typical website.
Given how important load times are, that can be a huge blocker.
For an extension, you download the model once, deliberately, when you install the extension, so it taking some time is less of an issue[^extension-issues], while website use is generally more ephemeral.
This is less true for websites that users typically return to often, since the site can then cache the model so the download cost is only paid once.

Lastly we have browsers, and it's a mess.
The most relevant features are WebGPU, Memory64 (see my [previous post](https://www.nobodywho.ai/posts/letting-rust-support-models-bigger-than-4gb-in-the-browser/)), and SharedArrayBuffer (for multi-threading).
All of these have patchy support across browsers and platforms.
Often, support just isn't implemented yet.
Other times it is, but requires a feature flag to be turned on in the browser (good luck getting your non-technical users to do that).
Sometimes, it is officially supported, but just works really poorly.
The best example of this is Firefox's WebGPU support mentioned above.

Multi-threading and SharedArrayBuffer is it's own can of worms because it requires strict cross-origin headers (COOP/COEP) which can be a real problem for some sites.
And of course the easiest way to meet these requirements are different for each browser.
On top of that, browsers vary wildly in how much storage they allow for websites, what their eviction policies are, how aggressive they are in killing workers, etc.
The only good news is that the large number of different browsers, in practice, [most people](https://gs.statcounter.com/browser-market-share) use Chromium-based browsers like Chrome and Edge[^everyone-uses-chromium], and that is where support is by far the best.

## LLMs do run in the browser

But not cleanly.
There are a lot of options and target platforms/browsers/use cases all requiring you to handle stuff differently.
Until browser support for the necessary features becomes much more mature, a library for browser LLM inference that just works in all browsers, on all platforms, for most use cases, will require a _lot_ of work on top of the basic browser APIs.
A bit ironic given that part of the dream of WASM is to _not_ depend on specific platforms so heavily.

I think incorporating such a general web LLM library into NobodyWho as part of our mission to support all platforms would be super cool, but for now we're exploring a few specific use cases where Emscripten and WebGPU with CPU fallback are the right choice.
We haven't figured out how to handle the spotty browser support yet, but we'll get to that in time.
Hopefully you'll see a release announcement right here within the next few weeks!

[^wasi-experimental]: [Everything is shimmed ATM](https://www.npmjs.com/package/@bytecodealliance/preview2-shim), which makes it pretty damn slow.
[^webnn-experimental]: It's supported [nowhere](https://web-platform-dx.github.io/web-features-explorer/features/webnn/).
But at least there's a [bug report](https://issues.chromium.org/issues/40206287) on that for Chromium!
[^extension-issues]: Extensions have other issues though.
Browsers generally [aggressively kill](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle#:~:text=Chrome%20terminates%20a%20service%20worker,30%20seconds%20of%20inactivity) background processes like those an extension would hold an LLM in, so without some hacky solutions (e.g. [offscreen documents](https://developer.chrome.com/docs/extensions/reference/api/offscreen)) to keep them alive you'd need to constantly reload the multi-GB model from disk.
[^everyone-uses-chromium]: I'm not saying this is a _good_ thing, just that it is the case, unless you're targeting some specific demographics.
E.g. iOS browsers are all WebKit based (like Safari) while the proportion of Firefox users is higher among Google ~~hating~~ skeptical tech-nerds.
