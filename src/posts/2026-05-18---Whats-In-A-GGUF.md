---
title: What's in a GGUF, besides the weights - and what's still missing?
date: 2026-05-18
description: "What extra stuff is needed to properly run a language model? Besides the weights of a language model, what is the gguf metadata that we need to parse and use?" 
slug: "whats-in-a-gguf"
---


GGUF is the file format that ggml-org/llama.cpp uses for language models.

The *really neat* thing about GGUF is that it's just one file.
Compare this to [a typical safetensors repo on huggingface](https://huggingface.co/Qwen/Qwen3.5-0.8B/tree/main), where there's a pile of necessary JSON files scattered around - or to [a typical ollama model](https://ollama.com/library/qwen3.5:0.8b), which is an OCI with layers json, go templates, etc inside.

The contents are roughly the same, but GGUF makes it more ergonomic by keeping all this *stuff* in a single file.

But what is this *stuff*, and does it cover everything needed?


## Chat Templates

Conversational language models are trained on sequences that follow a specific format, that sort of look like a conversation.

For instance, Gemma4's format looks like this:

```
<|turn>user
Hi there!<turn|>
<|turn>model
Hi there, how can I help you today?<turn|>
```

...and LFM2's format template looks like this:

```
<s>
<|im_start|>user Hi there!<|im_end|>
<|im_start|>assistant Hi there, how can I help you today?<|im_end|>
```

..and that's just a basic example.
It gets significantly more complicated once we start adding fancy features, like how and when to format reasoning blocks, how to present tool descriptions, tool calls and their responses, as well as how to encode multimedia messages (images, audio, video, etc.).

All this is handled by a *chat template*, a script in the jinja2 templating language. See for instance the [chat template that ships with Gemma 4](https://huggingface.co/google/gemma-4-E4B-it/raw/main/chat_template.jinja). The default chat template is stored under the `tokenizer.chat_template` key in the GGUF metadata. A model *may* have multiple chat templates. E.g. one with tool calling support, and one without. Most commonly models ship with a single monolithic chat template, that will only bother with the tool calling stuff when tools are specified, but you do need to look for tool-specific chat templates in some models.

Jinja2 is a programming language, no doubt about it -
it has loops, conditionals, assignments, lists, dictionaries, etc. - so any conversational LLM application must ship a programming language interpreter capable of running programs like the ~250 line jinja script that gemma ships with, every time a new message is added.

Huggingface transformers uses jinja2 (the classic python lib), llama.cpp's llama-server and llama-cli use [their own jinja implementation](https://github.com/ggml-org/llama.cpp/tree/85d482e6b6706648070f620797e54f1a6a0ff3d8/common/jinja) (not to be confused with the somewhat baffling [llama_chat_apply_template](https://github.com/ggml-org/llama.cpp/blob/85d482e6b6706648070f620797e54f1a6a0ff3d8/src/llama-chat.cpp#L240) exposed in the libllama API, which hardcodes a handful of chat formats directly in C++ — a charming relic from before the real jinja implementation landed), and NobodyWho uses [minijinja](https://github.com/mitsuhiko/minijinja), which is a reimplementation of jinja by its original creator in pure rust (not to be confused with [minja](https://github.com/google/minja), a minimalist jinja library that was once used by llama.cpp).

There is [a sizeable performance difference](https://gitlab.com/AsbjornOlling/chat-template-benchmark) between those jinja implementations. But chat templating isn't exactly the performance bottleneck in a local LLM application, so it's not worth bickering about.

## Special Tokens

Language models will readily output the next token for any sequence of tokens you feed it, forever - so we need some kind of way to stop them.

The typical solution for this is some kind of end-of-sequence token.
The idea is for the inference engine to stop generation, whenever the model emits such a token.

This is an example of a special token. Special tokens are generally tokens that have a broader semantic meaning than the letters they tokenize to.
They're generally tokens that shouldn't be shown to the user, although they (usually) still have a textual representation, so they *can* be.

For example, a few tokens for Gemma4:

| Token ID | Textual representation | Purpose                                                     |
| -------- | ---------------------- | ----------------------------------------------------------- |
| 1        | `<eos>`                | End of sequence, model emits this to stop generation.       |
| 2        | `<bos>`                | Beginning of sequence, is prepended to inputs.              |
| 46       | `<\|tool_call>`        | Marks beginning of a tool call.                             |
| 47       | `<tool_call\|>`        | Marks end of a tool call.                                   |
| 105      | `<\|turn>`             | Beginning of a conversational turn.                         |
| 106      | `<turn\|>`             | End of a conversational turn.                               |

## Sampler Configuration

Language models output a distribution of next-token-probabilities. Selecting a token from this distribution is called sampling.

The simplest approach is to randomly select from the weighted distribution.

But we can do more. It has been shown that you can get even better results by applying some transformations to the probability distribution before selecting a concrete token.

When research labs ship a new model, they often include a specific recommended sampler configuration.

I have all too often seen people go copy-paste these values from a markdown file somewhere, to get better responses from the model.

To save users that step, we started uploading a small collection of curated models to [our huggingface page](https://huggingface.co/NobodyWho/models), bundled with the recommended sampler settings in a format we came up with ourselves. It worked, but it meant every model needed a NobodyWho-side conversion to be useful.

Happily, a [recent addition to the GGUF format](https://github.com/ggml-org/llama.cpp/pull/17120) lets the sampler chain be specified directly in the model file. That makes our custom format obsolete — which is exactly the outcome we wanted.

## Sampler Chain Sequence

I quite like [this web app](https://artefact2.github.io/llm-sampling/) for quickly getting a feel for what the different types of sampler steps do.
If you drag-and-drop the individual steps, you'll notice that the order of sampling steps can make a big difference for what the final distribution is like.

It's frustrating to me that most sampler config formats (including ollama images' json files and HF's `generation_config.json`) don't have any way of specifying the order of sampling steps.
I'm quite happy that the GGUF standard for this includes the `general.sampling.sequence` field, which lets you specify the order.

But still, many GGUF models will omit this field and expect the implicit order of "whatever llama.cpp does by default". Fine. Implicit, but it works.

## What's still missing?

Good inference engines aim to provide a unified interface for different language models.
The *extra stuff* in GGUF metadata covers a lot of this, so parsing and using that stuff lets us avoid a lot of model-specific codepaths.

### Still Missing: Tool calling formats

One thing that seemingly every inference engine has hardcoded paths for is parsing different tool call formats.

For instance, a Qwen3 tool call looks like this:

```
<tool_call>{"name": "get_weather", "arguments": {"location": "Copenhagen"}}</tool_call>
```

a Qwen3.5 tool call looks like this:

```
<tool_call>
<function=get_weather>
<parameter=city>
Copenhagen
</parameter>
</function>
</tool_call>
```

...and a Gemma4 tool call looks like this:

```
<|tool_call>call:get_weather{city:<|"|>Copenhagen<|"|>}<tool_call|>
```

Currently, a bunch of different inference engines rush to implement parsers whenever a new model is released.

It would be a fantastic addition to the GGUF standard if model files would include a grammar, which we could derive a parser from.

In NobodyWho, we go one extra (somewhat unique?) step wrt. tool calling, because we generate a unique constraining grammar for the specific tools passed.
This means that we can guarantee type-safety for the tool calls. This is *especially* useful for the smallest models (1B or less) which can sometimes mess up and e.g. pass a float when an integer is required.

While specifying a grammar that we could derive a generic tool calling parser from would be useful, NobodyWho would still need to implement the functions to generate grammars for each specific tool passed.

It's an interesting problem to come up with a sort of meta-grammar format, which we could use to derive concrete grammars for specific tools, from which we could derive parsers.

### Still Missing: Think tokens

This is definitely the easiest one to just add.

The [upstream huggingface repos](https://huggingface.co/google/gemma-4-E2B/blob/main/tokenizer_config.json#L31) have begun to include a `think_token` field.
This is super useful for separating the thinking section of a generated output, since it should generally either be stripped or rendered differently from the main output.

Somewhy, [the downstream GGUF conversions](https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/blob/main/gemma-4-E2B-it-Q4_0.gguf) typically don't include this one.
This makes GGUF-based inference engines incapable of separating the think streams from the main output, without having to write specific codepaths for specific model-families.

Adding `think_token` to the standard GGUF conversion pipeline would just fix this. We should do that.

### Still Missing: Projection Models

Multimodal LLM interaction (i.e. letting the LLM natively see images and audio, rather than just text), requires an additional model for processing the non-text input, known as a "projection model".

The convention is to then pass in *two* GGUF files: one GGUF for the main language model, and a smaller model for processing images and audio.

This breaks the just-one-file ergonomics. It would be a great improvement if the single GGUF file could bundle the projection model weights and config inside the main file.

The projection model is often ~1GB in size - enough of an overhead that we definitely want to skip it when it's not used. But I think it's reasonable to provide two variants of the GGUF: one with projection weights, and one without.
That could get us back to the situation of managing just one url to download, just one file to cache on disk, etc.

### Still Missing: List of Supported Features

Models just don't support the same stuff, and it's not easily detectable from the GGUF file what stuff is actually supported.

Some models support image ingestion, some don't. The best way to handle this right now, is to assume support for images when a projection model is passed in.

Some models natively support tool calling, some don't. The best way to handle this right now, is to do substring matching on the chat template, to see if it tries to render the list of tool json schemas. This is obviously hacky.

Some models will emit thinking blocks, some won't. Since thinking tags are typically missing from GGUF metadata, I'm not sure if there is any good way to see if we expect thinking blocks from a model.

I would love for the GGUF community to start adding feature flags to the model files, such that model-agnostic inference libraries like ours can more consistently provide error messages and warnings when a consuming program tries to e.g. do tool calling on a model that doesn't natively support tool calling.

## Conclusion

I love GGUF.

I love it because it's just a single file, that covers all of the *stuff* needed to run a model *correctly* without having to add a bunch of model-specific codepaths.

I also love GGUF because it's an open, extensible format, with a strong community around it.

This means that we can work together to strengthen the standard, and keep a great developer experience while being able to easily swap out models in an application, without having to re-write any code.

This post covers a bunch of stuff that's already great about the GGUF metadata, and a bunch of things that we'd like to improve
Keep an eye on our huggingface page and the llama.cpp issues board in the coming weeks, if you'd like to follow our work in this area.
