---
title: LLMs are better at harder things
date: 2026-10-30
author: Asbjørn Olling
categories: ["Technical"]
description: "Now is a good time to start using hard technologies. Embrace them with LLMs."
slug: "LLMs-are-better-at-harder-things"
---

LLMs are better at harder things.

Stop using "easy" technologies.

The easy/hard tech tradeoff traditionally goes something like this:

If you develop using the harder thing, then writing the code takes longer, but the resulting program gets some *neat properties*.
If you write using the easier technology, then writing the code takes less time, but you lose out on those neat properties.

The kicker is that with LLMs, the time to write the code has decreased by a lot. Enough that it now takes approximately the same amount of time to write a project in python or rust.

With the time-to-write debuff being so heavily nerfed, it now makes a lot more sense to pick up the "hard" technologies.

Of course I'm only considering technologies on the pareto frontier of difficulty vs *neat properties*. E.g. brainfuck is difficult in an arbitrary way that doesn't yield any advantages. Writing machine code is difficult, and rarely faster than a mature compiler.

So what are these harder technologies that we should be using, and what neat properties do they give?

Here's just a few of the ones I like:

- **Nix**: reproducibility of builds and deployments, portability of dev environments
- **Rust**: performance, safety and correctness
- **Testing**: correctness
- **Lean, proof tools**: radical correctness
- **Strict schemas, constraints**: data consistency
- **Immutability and purity**: properties captured at function signature level, simpler refactoring and parallelization.

*This is obviously not a complete list.*

## Harder is easier, actually.

Most of the "hard" technologies I mention are "hard" because you shift a lot of the failures to build-time. Stricter compilers, datastructures, build tools and protocols can all contribute to surfacing an error earlier, so you have to convince your tooling that the code is correct before you get to use it.

I was definitely advocating for stricter build tools even before capable LLMs, arguing the point that while it may take longer to get to the first *running* program, it takes far less time to get to the *correct* program.

## ...which is good for training LLMs

But this property of getting errors earlier is especially useful for LLMs, because it can be used at training time. The frontier labs are definitely training their models against tools like the rust compiler and the lean compiler.

## ...and even more so for human review

Tech with strict semantics is easier to review, because you can trust the foundational tech to implement these safeguards instead of having to trust correctness across the entire codebase.
How easy is it to answer questions like "is this data structure ever being mutated concurrently", or "can this integer ever be even" is much easier to do when you're using trustable tools with strict semantics.

## So...

- Choosing "harder" tech means trading debugging time for development time
- This is a much better deal now, just because LLMs make development time cheaper
- Moving errors to development time makes for a great training environment, which makes LLMs naturally better at stricter tools
- Having your tools provide concise strict semantics let's you understand properties of code by reading only a subset of it.

"Harder" tools were already better than "easier" tools for getting to reliable and oerformant software quickly - but for so many reasons, it's an ever better deal if you're using LLMs to code.