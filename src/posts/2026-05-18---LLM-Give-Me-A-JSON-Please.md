---
title: LLM, give me a JSON please. Make no mistakes.
date: 2026-05-18
description: "So how *exactly* do you make your LLM output a JSON? What happens under the hood? And how do you make it reliable and fast? Diving into constrained sampling."
slug: "llm-give-me-a-json-please"
---

Imagine, you have finally managed to set up the LLM inference for your application, and now is it even able to respond. And it can do so much stuff!
But for most of these use-cases, getting "just" a text back is very limiting. In fact, in order to make most of the non-chatbot use-cases to work,
you would need more structured info like a JSON. So you just append to the prompt:

```
Remember to give me the output in a JSON format. Make no mistakes.
```

As the JSON output gets longer and longer, somehow your super smart model fails and apart from not getting the object keys right,
appends the additional "," at the end of the object, which makes parser complain.

Being able to control what format exactly does your LLM produce is super valuable. Let us thus take a deep dive into how do you
go past "make no mistakes" and how do the inference engines do it reliable and fast.

## Autoretries

The first solution that comes to mind is just to employ some retry strategy at the message level. Essentially:
```python
while True:
  answer = llm(prompt)
  if is_json(answer):
    break
```
This works. The only positive thing I can think of is that you can treat the LLM as a complete blackbox, which might
be viable for some libraries (actually I believe this is what LangChain does). For the negatives, there are plenty:
- by being "unlucky" or employing smaler models, you can be looping for very long or forever
- youre wasting enormous number of tokens, by discarding whole messages
- to be able to get a JSON, you need to construct or download specific parser, which is not very extensible

So if you dont have to, just **don't** do this please. However, by looking more closely into the LLM, you can have a little
bit more principled approach.

## Constrained Sampling

There are two observations, which we can make.

First, LLMs generate outputs by tokens and usually you don't have to generate the whole answer to see, that something is wrong.
We can retry right away, when the model makes the first error which is not in the right format.
```python
answer = ""
while True:
  token = llm.next_token(prompt + answer)
  if token == "<eos>":
    break

  if is_partial_json(answer):
    answer += token
```

Secondly, the answer tokens don't appear out of the blue. Given a text, LLMs produce a probability distribution on the next token.
If we don't just sample from this distribution, but set the probability of wrong tokens to 0, we are guaranteed a right continuation.
```python
answer = ""
while True:
  token = llm.next_token(
    prompt + answer,
    mask=possible_next_json_tokens(prompt + answer)
  )

  if token == "<eos>":
    break
```
So even though we are still looping, there is no discarding going on - we can't be unlucky and we are not wasting compute.
The hard part is now how to specify the possible next tokens (generally called "mask") and how to do that quickly,
so the LLM is not waiting for us.

## Specifying the Format

What exactly is JSON? To be able to construct the mask, we have to be able to answer this token by token.
One of the great ways, that we are able to precisely specify some text format, are regexes.
Unfortunately, as name suggest, regexes are made for specifying regular languages, which JSON is not.
With the (basic set of) regexes, you won't be able to for example guarantee, that any opened `{` will be also closed by corresponding `}`.

More fitting way for this use case is employing JSON schemas. If you don't know JSON schemas, they are essentially a meta language
on top of JSON, to specify what JSON format you expect. This way, we can say for example:
```json
{ "type": "object" }
```
to get any JSON object. Or, if you want something more concrete:
```json
{
  "type": "object",
  "properties": {
    "name": "string",
    "age": "integer"
  }
}
```
This is more concrete specification and some of the inference engines/APIs accept directly JSON schemas! (e.g. Claude API, OpenAI API, vLLM, etc.)
On the other hand, we did not really move towards a "lower level" specification of what we want; JSON schemas are still quite abstract.

> **Note**, that with all of the formats (regexes, JSON schemas, grammars) it is still important to tell the LLM what
> is it that you expect in the prompt. If you do not, the token distributions will stay as if the output was not constrained
> but you will probably sample tokens that the LLM did not expect, possibly degrading the performance.

## Grammars to the Rescue

More low level and general specification can be achieved by passing in grammars.
Grammars are a precise descriptions on what strings can be generated - they are typically utilized for example in programming language
theories (parsers), linguistics, and some parts of theoretical computer science. In the inference engines they typically underlie
processing all of the constrained generation, whether it is specified by regexes, json schemas or "manually".

Example of such a grammar could be:
```
INT    ::= "-"? [0-9]+
```
which provides an INT rule for generating any signed integer.
These rules can be then composed in a way where they "call" each other, to form larger structures:
```
ROOT   ::= "{" WS "\"name\"" WS ":" WS STRING WS "," WS "\"age\"" WS ":" WS INT WS "}"
STRING ::= "\"" [^"]* "\""
INT    ::= "-"? [0-9]+
WS     ::= [ \t\n]*
```
which is very simplified grammar for the JSON schema we discussed earlier. The WS rule is capturing any whitespace, STRING consumes strings
and ROOT just acts as an entrypoint and assembles everything together. This exact format of writing down the grammars is known as GBNF
and underlying the constrained generation in llama.cpp, but also other engines.
If you want to read more about it, I recommend starting [here](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md).

With grammars in place, we have done the work on the "users" side - we have general and exact specification from the user
of what they actually want. Still, these are not the token masks. Now, we will dive deeper into how do the inference engines
convert the grammars into masks (fast).

## Automatons

Let us start simple and consider the INT rule again:
```
INT ::= "-"? [0-9]+  
```
This is essentially just a regex and as you might know, every regex is convertible into finite state automatons (FSA).
There is 1 to 1 correspondence between regexes and FSAs, and algorithms how to construct one from the other.
The INT grammar would therefore have resulted in:

```
->  S0 --["-"]------> S1
    |                 |
    |                ["0"-"9"]
    |                 V
    + ---["0"-"9"]--> FS --+
                         | ["0"-"9"]
                         +-+
```

This is a great step forward! Starting in the state S0, we can just mask all of the tokens for which
we dont have any transitions to next states. In the final state FS, we just allow the LLM to generate also
the end of sequence token, and we are guaranteed to get the right output.

However, one of the problems left to solve is that todays LLMs do not produce characters/bytes, but tokens.
We thus have a great harness to constrain the LLM on which bytes it can produce, but the LLM is capable of giving us only
tokens back.

## Detokenization Problems

Solving the detokenization problem nicely (meaning reliably and quickly) is *difficult* and seems to be the main challenge
of the inference engines and libraries doing constrained generation. Tokens are generally byte sequences,
so what you are actually getting from the FSA perspective are "walks" following mutliple arrows in sequence.
Your task is then to select just the walks, which "dont fall" out of the FSA. We will address the "falling out" of FSA as
the token being _rejected_.

The solution is quite simple. For each of the FSA states just precompute a hashmap of all of the tokens, which dont lead to rejection
and mask the rejected ones. If you do this upfront and not on every step, the cost is then O(|S| x |V|),
where S are states and V are all of the tokens (also called vocabulary).
But with todays vocabularies exceeding 100k tokens, the precomputation of this index can reach seconds or even minutes.
On some places (for example server instances of LLMs) it is not a problem - it is conceptually what the library [outlines](https://github.com/dottxt-ai/outlines)
does, which was still in use for vLLM, until being replaced as the default option in late 2024.

## Ditching Precomputation

For some settings, like on-device LLMs, precomputing the masks for minutes is not feasible. The other tradeoff is doing everything per token sampling,
which is what [llama.cpp](https://github.com/ggml-org/llama.cpp) does in its grammar processing. Given the solution
outlines took, you might have also pondered about different way to approach this. If the tokens are not bytes with the FSA
wants, but byte sequences, why just not push them through the FSA one by one at the current state and find out where you end up?
That also clearly works, but there are some complications comming with more complex grammars.

## Shift of Perspective

I think getting the FSA intuition is crucial, however, it does not scale with more rules. As you might know,
context free grammars like GBNF are generally more expressive than FSAs. To advance we need to shift the perspective -
now we were looking at what we produced and traversing the FSAs until some final state.

What we will do instead is to use the notion of a stack, to represent what is still missing from a succesful generation.
When nothing misses, we are sure we can accept the word and stop generating. More concretely, consider grammar like:
```
ROOT ::= 
```








---


TODO:
- dumb way to fix it: autoretries
- smart way to fix it: constrained sampling
- how can the format be specified: json schemas, regexes, grammar languages
- how it works underneath
  - outlines
    - formalizing as PDA/FSM
    - main problem is the transition between tokens <-> bytes
    - conceptually simple, but precomputation heavy
  - llama.cpp
    - multiple stacks
    - no precomputation whatsoever
  - xgrammar
    - decomposition into processing FSMs/PDAs
    - huge precomputation of the masks for token/stack configurations
    - jit PDAs only for the needed cases
  - llguidance
    - no precomputation, but also little step overhead
    - real struggle is quickly processing the FSMs cases
    - builds token tries, to quickly process sparse masks
    - optimizes slices, to quickly process dense masks
