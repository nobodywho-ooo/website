---
title: Beginner's Guide to Essential Terms in Artificial Intelligence
date: 2026-05-04
categories: ["Guide"]
description: "This article provides a glossary covering essential AI vocabulary, definitions, and terminology"
image: /assets/images/blog/2026/beginner-guide-to-essential-terms-in-ai/beginner-guide-in-essential-terms-in-ai.png
slug: "beginners-guide-to-ai-terms"
---

![Beginner's Guide to Essential Terms in Artificial Intelligence](/assets/images/blog/2026/beginner-guide-to-essential-terms-in-ai/beginner-guide-to-essential-terms-in-ai.png)

AI has its own language, and if you're just getting started, it can feel like everyone else got the memo but you.

Terms like *tokens*, *inference*, and *quantization* get tossed around in articles, videos, and job descriptions as if they're common knowledge, but they're not.

This guide helps you to navigate in the AI jungle, it covers the core AI vocabulary you'll encounter and defines it simply. Whether you're building something, exploring the field, or just trying to follow the conversation, these are the terms worth knowing.

---

## 1. The AI Stack

*The big picture.*

### Artificial Intelligence (AI)

The field of computer science focused on building systems that can perform tasks that normally require human intelligence, like understanding text or audio, recognizing images or making decisions.

The term "AI" is ultimately a moving target. As the border between machine tasks and human tasks moves, the definition shifts too.

### Machine Learning (ML)

A subset of AI where systems learn from data instead of being programmed. Rather than writing rules by hand, you feed the system examples and it figures out the patterns on its own.

### Deep Learning (DL)

A subset of machine learning that uses neural networks with many layers to learn from large amounts of data. It's the technology behind most modern AI breakthroughs. State-of-the-art systems for image recognition, speech synthesis, and large language models all rely on it.

### Generative AI (Gen AI)

Generative AI refers to Artificial Intelligence systems that are capable of creating new content such as text, images, audio, video, or code.

---

## 2. How Models Are Built

*Behind the scenes.*

### Dataset

A structured collection of data used to train, test, or evaluate a model. Datasets can contain text, images, audio, or any other form of information. The quality and size of a dataset directly affects how well a model performs.

### Training

The process of exposing a model to data so it can learn patterns. During training, the model adjusts its internal parameters millions (or billions) of times to get better at its task.

### Parameters / Weights

The internal numerical values a model learns during training. Parameters are what the model actually "knows", before being fed any prompts. They encode the patterns extracted from training data. A model with 70 billion parameters has 70 billion of these numbers, all tuned to make its outputs as accurate as possible. Weights is another term for the same thing, often used when referring to the files you download for open-weight models.

### Fine-tuning

The process of taking a pre-trained model and continuing to train it on a smaller, specialized dataset to adapt it to a specific task or style. Fine-tuning is faster and cheaper than training from scratch, and it's how generic models get turned into domain-specific ones.

### Distillation

A training technique where a smaller model (the student) is trained to mimic the behavior of a larger model (the teacher). The goal is to compress the capabilities of a large, expensive model into a smaller, faster one.

### Quantization

A technique for reducing a model's size by lowering the precision of its weights like for example, going from 32-bit floats to 8-bit integers. Quantized models are faster and cheaper to run, with a trade-off in accuracy.

---

## 3. What a Model Is

*The different shapes a model can take.*

### Model

The output of training, which consists of one or several files that have learned to map inputs to outputs. Models can range from a few megabytes to several terabytes.

### LLM (Large Language Model)

A type of deep learning model trained on massive amounts of text data to understand and generate human language. LLMs like GPT, Claude, and Gemini predict the next most likely word/token given a context. They're the engine behind most modern AI chat and writing tools.

### SLM (Small Language Model)

A language model trained with fewer parameters than a typical LLM, designed to run efficiently on limited hardware like laptops, phones, or even smartwatches. SLMs are not categorically different from LLMs, but simply smaller variants.

### Mixture of Experts (MoE)

An architecture where only a fraction of the model's parameters are used for any given token, rather than all of them. This means MoE models still need a lot of memory to hold all the weights, but they spend less compute per token, so they run faster than a dense model of equivalent size. Recent examples include DeepSeek, Mixtral, and Qwen's MoE variants.

### Open-weights Models

Models that are publicly released, allowing anyone to download, run, and fine-tune them. Popular examples include Llama 3, Mistral, Qwen, Gemma and DeepSeek.

The term "open-weights" is used rather than "open-source" to specify exactly what is being released. "Open-source" refers to the publishing of source code, which is human-readable code used to produce a non-human-readable binary artifact (the compiled program). The model itself is a non-human-readable binary artifact, so the term "open-weights" is used to specify that it's the *weights* of the model that are open, and not necessarily the training source code or dataset that was used to produce the model.

### Vision Model

A model specialized in processing and understanding images. Vision models can classify what's in an image, detect objects, generate captions, or power visual search.

### Multimodal Model

A model that can process or generate more than one type of data like text, images, audio or video. For example, GPT-4o and Gemini are multimodal: you can send them an image and ask a question about it, or have them describe what they hear in an audio file.

Multimodal models aren't necessarily capable of ingesting and outputting the same types of data. Many multimodal models can receive image or text inputs, and only generate text outputs.

### Reasoning Model vs. Thinking Model

These terms are often used interchangeably, but there's a subtle distinction.
A **reasoning model** is explicitly trained or prompted to work through problems step by step before producing an answer, breaking complex tasks into logical stages.
A **thinking model** typically refers to models that have a dedicated internal "thinking" phase, where the model processes before responding.
In practice, both aim to improve accuracy on complex tasks by slowing down the output process.

---

## 4. Language & Text Processing

*How models read and represent text under the hood.*

### Token

The basic unit an LLM processes. For text, a token is roughly a word fragment, "learning" might be one token, while "incredible" might be split into two tokens: "in" and "credible". Models don't read characters or full words, they read tokens.

### Tokenization

The process of converting some kind of input (text, image, audio, etc.) into tokens. All model inputs are converted to tokens before being fed into the model.

### Embeddings

A way of representing data (text, images, audio) as vectors (lists of numbers), in a high-dimensional space. Similar concepts end up close together in that space. Embeddings are what allow models to understand that "king" and "queen" are related, or that a photo of a cat is similar to the word "cat."

Embeddings are particularly useful in RAG systems, to identify relevant sources of information to include.

---

## 5. Using a Model

*The controls and inputs that shape how a model behaves.*

### Prompt

The input you give to a model. For language models, a prompt is the text, like a question, instruction, or context that the model responds to. For multimodal models, the prompt could also contain an image or some audio. Prompt quality directly affects output quality. Small changes in wording can produce significantly different results.

### System Prompt

A special prompt, invisible to the end user, that sets the model's behavior, tone, and constraints before the conversation begins. Developers use system prompts to give a model its "personality" or restrict what it can and can't do. It's a configuration layer on top of the model. Most models are trained to prioritize following instructions in the system prompt over any subsequent instructions.

### Context Window

The maximum amount of text a model can process at once, both input and output combined. If a model has a 128k token context window, it can "see" roughly 100,000 words at a time, since there are roughly 0.75 words per token. Anything outside the context window is invisible to the model.

### Latency

The time it takes for a model to respond after receiving input.
In AI products, latency matters for user experience. It's influenced by model size, what device it's running on, and whether the output is streamed token by token or returned all at once.
It's useful to measure both the time-to-first-token (TTFT) and the time to complete an entire response. In use-cases where you can stream the tokens to the user, displaying the very first token when it is generated, TTFT matters most.

### Token throughput

Typically measured in *tokens per second*, this is a measure of how quickly the model can process and generate tokens.
The speed to read a bunch of tokens and the speed to write a bunch of tokens are very different. The token throughput of reading is often around 10x as fast as the token throughput of writing tokens.

---

## 6. Sampling

*Controlling how tokens are selected.*

### Sampling

Under the hood, generative language models output a probability distribution for the next token in a sequence. If given the sequence of tokens `["Once ", "upon ", "a "]`, a model might output a distribution with a high probability for the token "time", a much lower probability for the token "hill", and an incredibly low probability for nonsense tokens like "13".

In order to actually generate a sequence, we must select one of these tokens to accept and output to the user. This process of selecting a token from the probability distribution is known as sampling.

While it's tempting to simply select the most probable token, it has been shown that language models generate much better outputs when some randomness is applied. The field of sampling in LLMs is about designing exactly how this random selection works.

### The Sampler Chain

A sampler consists of two phases:

First, any number of transformations is applied to the probability distribution. These steps might zero the probability of a bunch of tokens, or shift the distribution of all tokens.

You can try to play with the token probabilities on [this website](https://artefact2.github.io/llm-sampling/). If you drag-and-drop the sampling steps, you may notice that the order of steps applied can make a difference on the result.

Once the sequence of transformations has been applied, the sampler chain finalizes by selecting a token from that distribution.

### Greedy Sampling

Greedy sampling is the sampling technique where you always select the most probable token, sidestepping any randomness in the sampling process. Greedy sampling leads to very predictable and boring output.

### Dist sampling

Dist sampling is the practice of selecting a token randomly, weighted by each token's probability.

### Temperature

A transformation that can be applied to token probability distributions to shift it towards preferring the more probable or the less probable tokens.
If a temperature of greater than 1 is applied, the high-probability tokens are made less likely, and the low-probability tokens are made more likely.
If a temperature of less than 1 is applied, the high-probability tokens are made more likely, and the low-probability tokens are made less likely.
A temperature of exactly 1 has no effect.

Low temperature makes the model more focused and deterministic, making it feel measured and predictable.
High temperature introduces more randomness and variation, making it feel creative and spontaneous.

### Top-k

Top-k limits the model to choosing from only the k most likely tokens at each step. For example, top-k of 40 means only the 40 most probable options are considered. 

### Top-p

Top-p (also called nucleus sampling) is more dynamic: it picks from the smallest group of tokens whose combined probability adds up to p, so at top-p of 0.9, the model considers just enough tokens to cover 90% of the probability mass.

### Grammar

A [formal grammar](https://en.wikipedia.org/wiki/Formal_grammar) can be applied as a transformation on token probabilities. This will exclude tokens (by setting their probability to zero), if they can't possibly result in a valid completion of the grammar. This can be used to guarantee that the output will always be compatible with a certain well-defined language, so a certain parser will always work. E.g. you can apply a formal grammar to force the model to only output valid JSON. NobodyWho uses grammars extensively for tool calling, to provide type-safety.

### DRY

A transformation that reduces the likelihood of tokens if they have been used recently. This is useful for preventing models from repeating themselves.

---

## 7. How Models Think & Respond

*What's actually happening when a model generates an output.*

### Inference

The act of running a trained model on a new input to get an output. Training is when a model learns; inference is when it's actually used. Most of what happens when you use an AI product like chatting, generating images, transcribing audio is inference.

### Chain-of-Thought (CoT)

A prompting technique where the model is encouraged to reason step by step before giving a final answer, rather than jumping straight to a conclusion. By writing out intermediate reasoning, like a person writing their thoughts on paper, the model tends to make fewer mistakes on complex tasks.

### Hallucination

When a model generates information that sounds confident but is factually wrong or completely made up. Hallucinations happen because models predict plausible sounding text, not verified truth.

---

## 8. Advanced Techniques

*Methods that extend or enhance what models can do.*

### RAG (Retrieval-Augmented Generation)

A technique where a model retrieves relevant external information before generating a response. Instead of relying solely on what it learned during training, the model pulls in fresh data from a database or document store at inference time. It's a practical way to keep responses accurate and up to date.

### Tool Calling

The ability of a model to invoke external functions or APIs during a conversation, things like searching the web, running code, querying a database, or reading a file. Rather than generating a plain text answer, the model recognizes when a tool would help, calls it with the right inputs, receives the result, and incorporates it into its response. Tool calling is what bridges a language model and the real world, and it's the core mechanism behind most agentic systems.

---

## 9. AI Systems & Evaluation

*How models are deployed, measured, and put to work.*

### Agent / Agentic

An AI system that can take actions, use tools, and pursue a goal across multiple steps, rather than just responding once to a single prompt. An agentic system consists of a model, a suite of tools, and some logic for when and for how long to run it. An agent will often run in several steps, until it reaches some well-defined result.

### Guardrails

Rules and filters applied to a model's inputs or outputs to keep it within acceptable boundaries. Guardrails can block harmful content, enforce topic restrictions, prevent the model from impersonating real people, or ensure responses stay on-brand for a product.

### Alignment

The challenge of making AI systems behave in ways that reflect human intentions, values, and goals. A misaligned model might be highly capable but pursue objectives in ways its creators didn't intend.

### Eval Benchmark

A standardized test used to measure and compare response quality. Benchmarks like MMLU, HumanEval, or HellaSwag evaluate specific capabilities like reasoning, coding, language understanding, or maths. They're useful for comparing models, but a high benchmark score doesn't always translate to real-world usefulness.
