---
title: The survival computer is the one in your pocket
date: 2026-10-29
author: Pierre Bresson
categories: ["Technical"]
description: "Survival LLM answers emergency questions offline from a bundled library, but it needs a laptop with 16 GB of memory. What a phone version would take."
slug: "the-survival-computer-is-the-one-in-your-pocket"
hideInBlog: true
---

[Survival LLM](https://www.brangus.io/survival-llm) is on the [Hacker News front page](https://news.ycombinator.com/item?id=50264853). It is a free, MIT-licensed AI assistant bundled with an emergency library, and once it is set up it needs no internet at all. The library holds about 930,000 Wikipedia articles alongside WikiMed, MedlinePlus, FEMA’s Ready.gov guides, U.S. military survival manuals, iFixit and wikiHow, and the app runs on Mac and Windows.

The design is the part worth copying. Survival LLM searches its library before it answers, lists the articles it read, and says whether an answer came from those articles or from the model’s own memory. For a tool you might open with no signal and a cut on your hand, that is the right priority. The hardware it asks for fits an emergency less well.

## What it needs to run

The smallest tier is a Mac or PC with 16 to 31 GB of memory, which runs IBM Granite 4.2 8B as a 6 GB file. On the project’s own test of 22 blackout and first-aid questions, graded blind, that model got the main point of official guidance right 14 times, while the larger models on bigger machines got 19 or 21 right. Power is the other cost. The page says a MacBook Pro drew about 100 W while answering and that a full battery covers roughly 100 to 300 questions, and adds that “a small generator or power station runs it easily.”

That works if the laptop was charged and you are next to it when you need it. The device you are most likely to have on you when the power goes is your phone, and the phone has no version of this yet.

## The library already fits on a phone

The reading half is solved. [Kiwix](https://get.kiwix.org/en/solutions/applications/kiwix-reader/), the offline Wikipedia reader, runs on Android and iOS as well as on desktops, and its smaller editions cut the size a lot. The edition without images is about 75% smaller than the full one, and the mini edition, which keeps only each article’s introduction and infobox, saves about 95%. Survival LLM’s own smaller library, which leaves out Wikipedia and iFixit, is a 1.3 GB download.

## What a phone version needs

The main doubt in the thread is fair. [One commenter](https://news.ycombinator.com/item?id=50264853) worries “that these tiny models aren’t really GOOD summarizers,” and a small model answering from its own memory will get more wrong than an 8B one. Survival LLM’s design already points at the fix. If the model’s job is to find the right passage and quote it, most of the work moves from the chat model to search, and search costs far less than generating text.

On a phone that takes three pieces. An embedding model turns each article and each question into a vector so the closest articles can be found, and the one [NobodyWho’s docs recommend](https://docs.nobodywho.ooo/kotlin/embeddings-and-rag/), [bge-small-en-v1.5 at Q8_0](https://huggingface.co/CompendiumLabs/bge-small-en-v1.5-gguf/blob/main/bge-small-en-v1.5-q8_0.gguf), is a 37 MB file. A reranker then scores the top candidates against the question more carefully. The docs suggest [bge-reranker-v2-m3](https://huggingface.co/gpustack/bge-reranker-v2-m3-GGUF/blob/main/bge-reranker-v2-m3-Q8_0.gguf), which is 636 MB at Q8_0, so it is the first piece to shrink or drop on a phone. Last, the chat model reads the best passages and answers from them, and [Qwen3 0.6B at Q4_K_M](https://huggingface.co/NobodyWho/Qwen_Qwen3-0.6B-GGUF/blob/main/Qwen_Qwen3-0.6B-Q4_K_M.gguf) is a 484 MB file.

The index takes storage as well. bge-small produces [384 numbers per text](https://huggingface.co/BAAI/bge-small-en-v1.5/blob/main/config.json), so one vector per Wikipedia article, at 4 bytes per number, comes to about 1.4 GB for 930,000 articles, and splitting articles into smaller chunks makes it bigger.

## The two numbers that decide it

Two figures would settle whether the phone version is worth building. The first is how a sub-1 GB model with good retrieval scores on Survival LLM’s 22 questions, since the only published score for the smallest tier is the 8B model’s 14 of 22. The second is how many answers a phone gets from one charge, the figure Survival LLM measured for a MacBook. Neither has been published.

NobodyWho has the parts for this in the bindings that ship to phones. The [Swift](https://docs.nobodywho.ooo/swift/embeddings-and-rag/), [Kotlin](https://docs.nobodywho.ooo/kotlin/embeddings-and-rag/), [Flutter](https://docs.nobodywho.ooo/flutter/embeddings-and-rag/) and [React Native](https://docs.nobodywho.ooo/js/embeddings-and-rag/) docs each have an Embeddings & RAG page that covers an Encoder for embeddings, a CrossEncoder for reranking, and an example that hands the top results to the chat model before it answers.

In Python, the search and the answer use the same two models:

```python
from pathlib import Path
from nobodywho import Chat, Encoder, cosine_similarity

EMBED = "huggingface:CompendiumLabs/bge-small-en-v1.5-gguf/bge-small-en-v1.5-q8_0.gguf"
CHAT = "huggingface:NobodyWho/Qwen_Qwen3-0.6B-GGUF/Qwen_Qwen3-0.6B-Q4_K_M.gguf"

# One short .txt file per article section. bge-small reads at most 512 tokens.
library = {p.stem: p.read_text() for p in Path("library").glob("*.txt")}
titles = list(library)

encoder = Encoder(EMBED)
vectors = encoder.encode_batch([library[t] for t in titles])  # run once, then store

def search(question, k=3):
    q = encoder.encode(question)
    scores = [cosine_similarity(q, v) for v in vectors]
    best = sorted(range(len(titles)), key=lambda i: scores[i], reverse=True)
    return [titles[i] for i in best[:k]]

question = "How do I keep food safe in the fridge during a power cut?"
sources = search(question)
context = "\n\n".join(f"[{t}]\n{library[t]}" for t in sources)

chat = Chat(CHAT, system_prompt=(
    "Answer only from the articles below and name the article you used. "
    "If they don't cover the question, say so.\n\n" + context
))
print(chat.ask(question).completed())
print("Sources:", ", ".join(sources))
```

Embedding the library is the slow step, so an app should do it once, at build time, and ship the vectors alongside the articles.

NobodyWho runs GGUF models locally and offline, with bindings for Python, Flutter, React Native, Swift, Kotlin and Godot. If you want to build the phone version, [star NobodyWho on GitHub](https://github.com/nobodywho-ooo/nobodywho).
