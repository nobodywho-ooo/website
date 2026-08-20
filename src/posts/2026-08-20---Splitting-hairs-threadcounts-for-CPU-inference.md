---
title: "Splitting hairs: threadcounts for CPU inference"
date: 2026-08-20
categories: ["Technical"]
description: "A technical deep-dive into CPU thread allocation for on-device LLM inference"
slug: "splitting-hairs-threadcounts-for-CPU-inference"
---

How many threads should you use for CPU inference?

If you spawn fewer threads than your CPU can handle, you have compute standing by unused. If you spawn more threads than the CPU can handle, you take on overhead without gaining any compute resources.

## The naive answer

Use something like Rust's `std::thread::available_parallelism()` to count the number of cores on your machine, spawn that many threads, and call it a day.

However, for compute-bound tasks, this often results in a too-high number of threads.

## Hyperthreading

Modern x86 CPUs support [hyper-threading](https://en.wikipedia.org/wiki/Hyper-threading), which tries to run several threads on the same core. Those threads get their own registers and program counters, but still share most of the compute resources.

If your program is reasonably efficient, hyperthreading means several threads end up competing for the same execution resources on a single physical core, so threads end up waiting.

Some programs, like [llama-cpp-python](https://github.com/abetlen/llama-cpp-python/blob/3691546f1c9e0c1bf93323dff02230bd959cf562/llama_cpp/llama.py#L312), assume they're running on a machine with two hyperthreaded logical cores per physical core, and run exactly half as many threads as there are logical cores. For a standard desktop x86 CPU, this works great.

However, not all CPUs support hyperthreading, and not all hyperthreading CPUs have exactly two logical cores per physical core.

## Physical cores

Instead, you can fetch a package like [num_cpus](https://docs.rs/num_cpus/latest/num_cpus/), which distinguishes [the number of actual physical cores](https://docs.rs/num_cpus/1.17.0/num_cpus/fn.get_physical.html), and run that number of threads.

This lets you run as many threads as there are physical cores, even on CPUs without a standard hyperthreading setup.

However, for mixed-core CPUs, like those in MacBooks or smartphones, running on every physical core is bad. These machines have some fast cores and some slower, power-efficient cores. You might expect running both to yield more compute than running the fast ones alone, but in practice, for workloads like inference, the fast cores finish quickly and then wait on the slow cores.

## What NobodyWho does

[In NobodyWho](https://github.com/nobodywho-ooo/nobodywho/blob/030632a07d4cda4097e3e6c5d0e81624b429ebe5/nobodywho/core/src/cpu.rs#L115), we count how many fast physical cores are on the system, and run that many threads. This is how we automatically get optimal performance for inference on heterogeneous CPUs too.

However, your computer might already have other compute-heavy work running on the fast cores. In that case, your inference thread occasionally gets bumped to a slower core, and you're back to the fast thread waiting on the slow one.

It turns out that if one of your fast cores is occupied, it's faster to run one fewer thread than to fight for that fast core and end up on a slow one.

But how do you detect how occupied the fast cores are? We haven't solved that problem yet in NobodyWho.

## Manual control

We now support the [n_threads](https://docs.nobodywho.ooo/python/chat/#cpu-threads) argument when instantiating a new LLM Chat on CPU. It defaults to the logic described above.

You could sweep across a range of thread counts with some workload and measure which is fastest, but that's too heavy to do on every startup for my taste.

The new defaults in NobodyWho are pretty sane. They're released and available for all 7 language bindings.