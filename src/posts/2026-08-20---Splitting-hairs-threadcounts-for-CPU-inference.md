---
title: "Use fewer threads for CPU inference"
date: 2026-08-20
categories: ["Technical"]
description: "How many worker threads should you use for CPU inference? Not all of them."
slug: "threadcounts-for-cpu-inference"
---

How many threads should you use for CPU inference?

## The naive answer

Use something like Rust's `std::thread::available_parallelism()` to count the number of cores on your machine, spawn that many threads, and call it a day.

This is used to great effect by `rayon` and the like, however for non-work-stealing compute-bound tasks, such as those spawned by `llama.cpp`, this often results in a too-high number of threads.

## Hyperthreading

Modern x86 CPUs support [hyper-threading](https://en.wikipedia.org/wiki/Hyper-threading), which tries to run several threads on the same core. Those threads get their own registers and program counters, but still share most of the compute resources.

If your program is reasonably efficient, hyperthreading means several threads end up competing for the same execution resources on a single physical core, so threads end up waiting.

Here's a inference benchmark of Gemma4-E4B on my Ryzen 7040 CPU, which has 8 phyiscal cores and 16 logical cores.

| threads |            test |                  t/s |
| ------- | --------------: | -------------------: |
|      16 |           pp512 |         94.66 ± 3.25 |
|      16 |           tg128 |         11.64 ± 0.75 |
|       8 |           pp512 |        105.94 ± 5.10 |
|       8 |           tg128 |         16.15 ± 0.07 |

Some programs, like [llama-cpp-python](https://github.com/abetlen/llama-cpp-python/blob/3691546f1c9e0c1bf93323dff02230bd959cf562/llama_cpp/llama.py#L312), assume they're running on a machine with two hyperthreaded logical cores per physical core, and run exactly half as many threads as there are logical cores. For many desktop x86 CPUs, this works great.

## Counting physical cores

**However,** not all CPUs support hyperthreading, and not all hyperthreading CPUs have exactly two logical cores per physical core. If you just halve the number of logical cores, you don't necessarily get the number of physical cores.

Instead, you can fetch a package like [num_cpus](https://docs.rs/num_cpus/latest/num_cpus/), which distinguishes [the number of actual physical cores](https://docs.rs/num_cpus/1.17.0/num_cpus/fn.get_physical.html), and run that number of threads.

This lets you run as many threads as there are physical cores, even on CPUs without a standard hyperthreading setup.

## Heterogeneous CPUs

**However**, for mixed-core CPUs, like those in MacBooks or smartphones, running on every physical core is bad. These machines have some fast cores and some slower, power-efficient cores. You might expect running both to yield more compute than running the fast ones alone, but in practice, for workloads like inference, the fast cores finish quickly and then wait on the slow cores.

Here's a inference benchmark of Gemma4-E4B on an M4 Pro Mac Mini, which has 8 fast cores, and 4 slow cores (Metal disabled to show CPU inference):

| threads |            test |                  t/s |
| ------- | --------------: | -------------------: |
|      12 |           pp512 |        179.28 ± 3.15 |
|      12 |           tg128 |         36.36 ± 4.25 |
|       8 |           pp512 |        199.24 ± 3.49 |
|       8 |           tg128 |         52.39 ± 0.16 |

[In NobodyWho](https://github.com/nobodywho-ooo/nobodywho/blob/030632a07d4cda4097e3e6c5d0e81624b429ebe5/nobodywho/core/src/cpu.rs#L115), we count how many fast physical cores are on the system, and run that many threads. This is how we automatically get optimal performance for inference on heterogeneous CPUs too.

## Competing with other processes

**However**, your computer might already have other compute-heavy work running on the fast cores. In that case, your inference thread occasionally gets bumped to a slower core, and you're back to the fast thread waiting on the slow one.

It turns out that if one of your fast cores is occupied, it's faster to run one fewer thread than to fight for that fast core and end up on a slow one.

Here's an inference benchmark of Gemma4-E4B on that same Mac Mini, but with a simple `python -c "while True: pass"` running in the background. Notice how 7 threads is faster than 8.

| threads |            test |                  t/s |
| ------- | --------------: | -------------------: |
|       8 |           pp512 |        137.12 ± 0.87 |
|       8 |           tg128 |         44.28 ± 0.70 |
|       7 |           pp512 |        148.83 ± 1.02 |
|       7 |           tg128 |         45.60 ± 0.25 |

But how do you detect how occupied the fast cores are? As you can see, we haven't solved the problem fully yet in NobodyWho, please do let us know if you know of a better approach!

## Manual control

We support the [n_threads](https://docs.nobodywho.ooo/python/chat/#cpu-threads) argument when instantiating a new LLM Chat on CPU. It defaults to the performance-core-counting logic described above.

You could sweep across a range of thread counts with some workload and measure which is fastest, but that's too heavy to do on every startup for my taste.

The new defaults in NobodyWho are pretty sane. They're released and available for all 7 language bindings.
