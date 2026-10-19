---
title: Why isn't Pi written in Lisp? Pi Durable in Erlang?
date: 2026-10-19
author: Asbjørn Olling
categories: ["Technical"]
description: "I'm a big fan of pi-coding-agent. I'm also a big fan of thinking about programming languages and their properties. When I combine the two, something feels dissonant."
slug: "why-is-pi-not-written-in-lisp"
---

I'm a big fan of pi-coding-agent. I'm also a big fan of thinking about programming languages and their properties. When I combine the two, something feels dissonant.

## Pi feels lisp-y

Since I first started using pi, I haven't been able to shake the hunch that it *feels* like something best written in lisp.

Why? Its goals align with the goals of lisp programs: minimal, radically extensible, self-modifyable and dynamic.

If you squint a little, emacs stans start to sound like pi stans.

>Yeah you can do that in emacs. Emacs even includes the tools to change to emacs in that way! Just whip up the elisp repl and there you go!

> Yeah you can do that in pi. Pi even includes the tools to change pi in that way! Just yeet a prompt like this and there you to!

I did hit a concrete snag when messing around with pi at one point: I was toying with the idea of storing the JSONL conversation history in the git tree (not as files, but as notes attached to the history). Eventually I convinced myself that this was not possible to do well without forking pi itself. Maybe this would have gone different in a homoiconic language?

## Pi Durable feels BEAM-y

I had this deja-vu feeling again when reading the [Pi Durable blogpost](https://earendil.com/posts/pi-durable/), but for a different technology this time.

It highlights a number of properties that come straight from the mouth of a Erlang/Elixir/Gleam/BEAM/OTP die-hard.

Earendil writes:

> We want to change the code of a running agent without stopping it.

> A tool call that is already running finishes on the code it started with

> That allows the harness to run on one machine while its tools run on another. Your env function builds the environment for every tool call, from the conversation's working directory, so each conversation can run in a different place.

> Installing an extension under a name that is already installed replaces it in one step.

> If the process dies, a new process opens the same storage, finds the unfinished tasks, and continues each one from its last checkpoint.

> Aborting a task aborts what it owns, bottom-up, so every task cleans up its own effects first, and a task only finishes once the work it owns has finished.

All of these sound like exactly features that are already implemented and battle-tested in BEAM/OTP. Is this an instance of [Greenspun's Tenth Rule](https://en.wikipedia.org/wiki/Greenspun%27s_tenth_rule) for Erlang?

## Should LLMs write in mainstream languages?

A common argument is that "LLMs are just better at writing typescript". Does the *agentic era* imply that we should double-down on the most mainstream tech stacks?

I often think about [Richard Feldman coping](https://youtu.be/ZsBHc-J9f8o) with having put years of his life into making Roc, a new programming language, just as LLMs were getting good.

At first he was distraught: Roc code is not well-represented in the LLMs' training dataset, and since LLMs are better at writing stuff they'd seen before, Roc would never grow popular enough to be represented in the dataset. Thus all new languages are doomed.

But then he did a 180: LLMs are *better* at writing in new languages than humans are. Just throw the docs and a few examples at the model, and it outputs good and valid code- accomplishing in minutes what would take an unassisted human days or weeks. LLMs are a great boon to niche technologies.

The Roc project then released a text file to throw at your coding agent and kept trucking.

It [does matter](https://paulgraham.com/avg.html) which programming language your program is written in. A programming language carries with it some properties that transfer onto the program artifact. A program written in Rust simply is more likely to be memory safe than a program written in C, even if you tell your agent to make no mistakes.

While it is possible to write your program in an arbitrary language, in such a way that it implements the properties you want, this is exactly how you end up with [Greenspun's Tenth Rule](https://en.wikipedia.org/wiki/Greenspun%27s_tenth_rule).

The point being: yes, while LLMs are better at writing typescript than other languages, they're also very good at writing in a language they've never seen before. Because your technological foundation does have a significant impact on the result, I believe the advantage of the softened learning curve far outweighs the LLM-familiarty advantage.

## Back to Pi

Earendil does address this in their single-entry FAQ for Pi Durable:

> Why TypeScript again?

> Because it is the easiest way to bootstrap this. But as everybody knows by now, it's very easy to port everything to Rust or assembler. We're not ruling this out in the future, but at the moment we are focusing on TypeScript

I read this as "It's not an informed choice. We just went with the tool that we had at hand", and that's fine by me.

## ...and what about our code?

We write [NobodyWho](https://github.com/nobodywho-ooo/nobodywho) in Rust because it gives us the properties we want. It gives us confidence in  correctness and reliability. It's highly portable with good cross-compilation for many targets. It has excellent FFI support (made legible via a strong macro system) which we use in two directions: binding downwards into llama.cpp for the juicy GGML acceleration, and binding upwards to the seven different programming languages you can use NobodyWho from.

People sometimes ask me if I had trouble finding people with sufficient Rust experience to recruit for this project. My answer is usually: "Why would they need Rust experience?"