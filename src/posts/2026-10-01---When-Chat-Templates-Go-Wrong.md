---
title: When Chat Templates Go Wrong
date: 2026-10-01
author: Pierre Bresson
categories: ["Technical"]
description: "How to find and fix a local model that won't stop, ignores the system prompt, or forgets instructions between turns, when the cause is a broken chat template."
slug: "when-chat-templates-go-wrong"
hideInBlog: true
---

A model running locally loads cleanly and answers correctly, then keeps generating past its answer, stops following the system prompt, or drops an instruction it followed a turn earlier. The same model served through a hosted API behaves normally.

This behavior usually traces back to the chat template or the token metadata stored in the GGUF file.

An instruction-tuned model is trained on conversations written in one exact format. The chat template reproduces that format at inference, so the model receives the same layout it saw during training. When the rendered prompt deviates from it, the model is working from input it was never trained on, and its behavior degrades.

Most models ship a correct template, so the fault is usually in a specific file or setup, and it can be fixed without touching the weights.

## The Chat Template

In that training format, control tokens mark where each turn begins and ends and which role is speaking. The wording inside a turn can vary, because that varies in training, but the control tokens and the structure around them are what the model keys on, and behavior degrades as that structure drifts from what the model saw in training.

The chat template defines that structure. It is a Jinja program that renders a list of messages into the single string the model receives, special tokens included, and it runs every time a message is added. These programs are not trivial, and the template Gemma ships with runs to roughly 250 lines. In a GGUF file the template is stored in the metadata under the `tokenizer.chat_template` key. (The wider tour of what else lives in GGUF metadata is in [What's in a GGUF, besides the weights](https://www.nobodywho.ai/posts/whats-in-a-gguf/).)

A common layout, ChatML, structures a turn like this:

```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
What is the capital of Denmark?<|im_end|>
<|im_start|>assistant
```

`<|im_end|>` is a single token with its own vocabulary id, which the model was trained to emit at the end of a turn and which the engine watches for to stop generation. The trailing `<|im_start|>assistant` line, with no content after it, is the generation prompt, the signal that the assistant's turn has begun, and without it the model has no indication that it should respond instead of continuing the preceding text.

Control tokens differ across model families, so Gemma marks turns one way and a ChatML-style model such as LFM2 or Qwen another, and a template written for one family does not align with the tokens another was trained on. Some models also ship more than one template, typically a plain one and a separate one for tool calling, and rendering the wrong variant changes the string with nothing to signal the substitution.

The template is a program that has to be run on every message, and the engine that runs it is not the same across tools. Hugging Face transformers uses jinja2, llama.cpp's server and CLI use their own Jinja implementation, and NobodyWho uses minijinja, a pure-Rust reimplementation.  
Model authors write and test their templates against transformers, so Python's jinja2 is the reference. Templates often call Python string methods such as `.strip()`, or helpers that transformers adds such as `raise_exception`, and the other engines have to reproduce them. When they do, every engine renders the same string and the difference between them is speed. When an engine is missing something a template uses, the template fails to render or produces a different string, and the model is back to input it was never trained on. NobodyWho defines `raise_exception` itself and turns on minijinja's Python compatibility layer, which supplies string and dictionary methods such as `.split()` and `.get()`.

A separate case is an older libllama call, `llama_chat_apply_template`, which ignores the model's embedded template and applies one of a small set of formats hardcoded in C++. This means that the template format in use is not the one the model shipped with, and a model outside that hardcoded set is rendered with a format that does not match it. The model can then ignore instructions or run past the end of a turn, even though the template stored in the file is correct.

This is also why the same model behaves correctly through a hosted API, where the serving stack applies the model's registered template and tokenizer and that layer is never exposed. Run locally, that layer is the caller's responsibility.

## Invalid Token IDs

Special tokens are referenced by id, as indices into the token list at `tokenizer.ggml.tokens`, and the metadata records which entry is beginning-of-sequence, which is end-of-sequence, which ends a turn, and so on. When one of those ids is negative or points past the end of that list, the file still opens and passes surface inspection. Current llama.cpp catches it at load, logs a bad special token warning, and falls back to a default id, so the model runs with a special token the metadata never intended.

## Silent Failures

When the token the model ends a turn on is not the token the engine treats as the stop signal, the end of the turn goes unrecognized and generation continues into the next one, with the model producing both sides of the conversation. Current llama.cpp recognizes common end-of-turn tokens such as `<|im_end|>` by name, even when the metadata names a different stop token. The run-on shows up with older engines, wrappers that stop only on the end-of-sequence id in the metadata, end-of-turn tokens outside the names llama.cpp checks, or files where the special tokens did not survive conversion. 

A chat model's end-of-turn token often differs from the base end-of-sequence token, so a ChatML model stops on `<|im_end|>` rather than the model's plain `<|endoftext|>` token, and that end-of-turn token has to be recorded in the GGUF metadata as the token to stop on. When it is absent or wrong, an engine that stops only on the recorded token watches for a token the model does not emit at the end of a turn, and generation runs past the assistant's response. This was reported in llama.cpp [issue \#5040](https://github.com/ggml-org/llama.cpp/issues/5040). A related conversion fault produces the same result: when the special tokens are not preserved as single tokens, the template emits the text `<|im_end|>` while the tokenizer splits that string into ordinary sub-word tokens, and the trained stop token never reaches the engine.

A missing generation prompt causes the model to continue the user's text instead of answering it. Incorrect whitespace around a role header tokenizes differently from the training format and lowers quality with no visible failure. Some fields do not survive conversion: the `think_token` separating a model's reasoning from its answer is frequently absent from GGUF conversions even when the upstream model defines it, and tool-call formats vary between families, so a template rendering them incorrectly produces calls the parser cannot read.

## Checking a Template

To check a template, run three checks:

1. Render the final string the template produces immediately before tokenization, with the special tokens in place, and compare it against the format on the model card character for character.  
2. Tokenize that string and confirm each special token resolves to a single dedicated id. A special token that splits into several ordinary tokens is why the model fails to stop.  
3. Check what the run stopped on. A generation that ends at the token limit without emitting a stop token means the stop token is wrong or unregistered.

## Diagnosing a Stop Token Mismatch

Take a ChatML model whose end-of-turn token, `<|im_end|>`, is not the model's base end-of-sequence token and is not recorded in the GGUF metadata as the token to stop on, running on an engine that stops only on the token recorded in the metadata. A single question returns a correct answer, then generation continues: the model writes a follow-up as the user, answers it, and halts only at the token limit. No error is raised and the transcript reads fluently.

The rendered prompt matches the model card, so the template text is correct. The turn markers tokenize to single ids, so the vocabulary is intact. Generation stopped on the length limit without the engine recognizing a stop token, and the stop token recorded in the metadata is the base end-of-sequence token rather than `<|im_end|>`. The weights are correct, so the fix is a metadata edit: set the stop token to `<|im_end|>`, and the same prompt answers once and stops.

## Correcting the Metadata

Each of these faults is a small edit, often a single field, yet correcting one has until recently required either re-quantizing the model or running ad-hoc Python scripts against the file, a change of a few bytes in an otherwise correct header. [gguf-surgeon](https://github.com/nobodywho-ooo/gguf-surgeon) opens the metadata block in a GGUF, reads and rewrites fields in place including the chat template and the token ids, and writes the file back with the tensor data byte-identical, so the model loads exactly as before.

An out-of-range id can be caught before publication with a single check:

```
gguf check model.gguf
```

It reports the offending key and that its id is out of range, in the wording of its validator: token id N is out of range (tokens array has M elements). Correcting a token id is one command, because set parses the value as the existing key's type. Replace 106 with the id of the correct token in the model's own vocabulary:

```
gguf set model.gguf tokenizer.ggml.eos_token_id 106 -y
```

Editing the template is a matter of reading it out, changing it, and writing it back:

```
gguf get model.gguf tokenizer.chat_template > template.j2
$EDITOR template.j2
gguf set model.gguf tokenizer.chat_template @template.j2 -y
```

In each case the tensor data is untouched and the file continues to load in llama.cpp.