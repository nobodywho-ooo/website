---
title: LLM, give me a JSON. Make no mistakes.
date: 2026-05-18
description: "So how *exactly* do you make your LLM output a JSON? What happens under the hood? And how do you make it reliable and fast? Diving into constrained sampling."
slug: "llm-give-me-a-json"
---

Imagine, you have finally managed to set up the LLM inference for your application, and now it is even able to respond to you.
And it can do so much stuff!
But for most of these use-cases, getting "just" text back is very limiting. In fact, in order to make most of the non-chatbot use cases work,
you would need more structured info like JSON. So you just append to the prompt:

```
Remember to give me the output in JSON format. Make no mistakes.
```

As the JSON output gets longer and longer, somehow your super smart model fails from time to time. Apart from not getting the object keys right,
it appends the additional `,` at the end of the last key-value, which makes the parser complain. You might ask, is there a better way?

There is!

Being able to control what format exactly does your LLM produce is super valuable and technically super interesting.
Let us thus take a deep dive into how you go past "make no mistakes" and how the inference engines do it reliably and fast.

## Autoretries

The first solution that comes to mind is just to employ some retry strategy at the message level. Essentially:
```python
while True:
  answer = llm(prompt)
  if is_json(answer):
    break
```
This works. The only positive thing I have to say about it is that you can treat the LLM as a complete blackbox, which might
be viable for some libraries (actually I believe this is what LangChain does). For the negatives, there are plenty:
- by being "unlucky" or employing smaller models, you can be looping for a very long time or forever, before reaching desired output
- you're wasting an enormous number of tokens, by discarding whole messages, even though they might not be all wrong
- to be able to get a JSON, you need to construct or download a specific parser, which is not very extensible

So if you don't have to, just **don't** do this please. However, by looking more closely into the LLM, you can have a little
bit more principled approach.

## Constrained Sampling

There are two observations, which we can make.

First, LLMs generate outputs token by token. Usually you don't have to generate the whole answer to see that something is wrong.
We can retry right away when the model makes the first error which is not in the right format. This way, we are not deleting the whole message,
but just the last token:
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

```
IMAGE HOW MASKING WORKS
```

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
The hard part is now how to specify the possible next tokens, generally called "mask", and how to do that quickly,
so the LLM is not waiting for us.

## Specifying the Format

What exactly is JSON? To construct the mask, we have to be able to answer this token by token.
One of the great ways that we are able to precisely specify some text format are regexes.
Unfortunately, as the name suggests, regexes are made for specifying regular languages, which JSON is not.
With the (basic set of) regex features, you won't be able to for example guarantee, that any opened `{` will be also closed by a corresponding `}`.

A more fitting way for this use case is employing [JSON schemas](https://json-schema.org/).
If you don't know JSON schemas, they are essentially a meta language
on top of JSON, to specify what JSON format you expect. This way, we can say for example:
```json
{ "type": "object" }
```
to get any JSON object. Or, if you want something more specific:
```json
{
  "type": "object",
  "properties": {
    "name": "string",
    "age": "integer"
  }
}
```
This is a more concrete specification and some of the inference engines/APIs accept JSON schemas directly! (e.g. Claude API, OpenAI API, vLLM, etc.)
On the other hand, we did not really move towards a "lower level" specification of what we want; JSON schemas are still quite abstract.

> **Note**, that with all of the formats (regexes, JSON schemas, grammars) it is still important to tell the LLM what
> is it that you expect in the prompt. If you do not, the token distributions will stay as if the output was not constrained
> but you will probably sample tokens that the LLM did not expect, possibly degrading the performance.

## Grammars to the Rescue

More low-level and general specification can be achieved by passing in grammars.
Grammars are precise descriptions on what strings can be generated - they are typically utilized in fields like programming language theory (parsers), linguistics, and some parts of theoretical computer science. In the inference engines they typically underlie
processing all of the constrained generation, whether it is specified by regexes, JSON schemas or "manually".

Example of such a grammar could be:
```
INT    ::= "-"? [0-9]+
```
which provides an INT rule for generating any signed integer.
These rules can then be composed in a way where they "call" each other, to form larger structures:
```
ROOT   ::= "{ \"name\":" STRING ",\"age\":" INT "}"
STRING ::= "\"" [^"]* "\""
INT    ::= "-"? [0-9]+
```
which is a very simplified grammar for the JSON schema we discussed earlier. The STRING rule consumes any sequences without `"`,
and ROOT just acts as an entrypoint and assembles everything together. This exact format of writing down the grammars is known as GBNF
and underlies the constrained generation in llama.cpp, but also other engines.
If you want to read more about it, I recommend starting [here](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md).

With grammars in place, we have done the work on the "user's" side - we have a general and exact specification from the user
of what they actually want. Still, these are not the token masks. Now, we will dive deeper into how the inference engines
convert the grammars into masks (fast).

## Processing Grammars

To understand how the grammars then translate into masks, we will need a bit of theory under our belts.
Let us start simple: with a simple integer rule and a whole string upfront, for which we just decide, if it corresponds to the grammar.
Starting with the INT rule:
```
INT ::= "-"? [0-9]+
```
We remove the syntactic sugar:
```
INT ::= "-" [0-9]+ | [0-9]+
```
and replace the `+` and `*` with recursion:
```
INT ::= "-" DIGITS | DIGITS
DIGITS ::= [0-9] | [0-9] DIGITS
```
This gets us simplified expressions, which are easier to work with. If you feel a bit lost on what actually happened,
we just made a few regex transformations, which are equivalent.

Now, to produce the masks, we will use a machine with a stack (or in the right terms "pushdown automaton", PDA).
You can think about a stack like an array, where from one end, we are allowed to append and pop elements.
In our case, these will be characters (in practice bytes) and _names_ of the rules (INT, ROOT, STRING, ...).
Normally, to check if a given string corresponds to the INT rule, we would begin by inserting the INT onto the stack.
```
stack: [INT]
string: -67
```
Whenever the machine sees a rule name, it then pops it and replaces by its definition. Moreover,
it also has to know which way to go (either with minus or without minus), as the rule allows `"-" DIGITS | DIGITS`.
For now, let's pretend it _just knows_:
```
stack: ["-", DIGITS]
string: -67
```
If it notices, that the string and the stack begin with the same symbol, it removes both and continues:
```
stack: [DIGITS]
string: 67

stack: [[0-9], DIGITS]
string: 67

stack: [DIGITS]
string: 7

stack: [[0-9]]
string: 7

stack: []
string: <empty>
```
Now that we arrived at an empty stack and empty string, we are ready to *accept*.
This way we know the string conforms to the grammar specified.

The last two problems we have are:
1. We can consume whole strings, but LLMs produce tokens.
2. The grammars can have multiple valid derivations, as in the example above.

How exactly you solve these problems then depends on the particular grammar library you use.
In the following, I will describe how [llama.cpp](https://github.com/ggml-org/llama.cpp) does this.

## From Whole Strings to Masks

Going from strings to tokens is _quite_ hard. If you look at the stack construction again, we are sort of consuming
our string character by character. We can take advantage of this.

Again, let's imagine we are constrained with the rule INT:
```
INT ::= "-" DIGITS | DIGITS
DIGITS ::= [0-9] DIGITS | [0-9]
```
Before starting the inference, we will instantiate the stack with the top rule - in this case `[INT]`.
```
stack: [INT]
```
Now it's time to sample a token! We will look at all of the tokens one by one. Tokens can be various byte sequences in general:
```
vocab: {42, 13, 7b, haha, ...}
```
For each token, starting with `42` we will try to advance the current stack. First, we will unroll the stack to get a non-rule on top.
```
stack: [INT]
stack: [DIGITS]
stack: [[0-9], DIGITS]
```
Then match as we are used to:
```
stack: [DIGITS]
token: 42 -> 2
```
and repeat:
```
stack: [[0-9]]
token: 2

stack: []
token: 2 -> empty
```
Great! We reached a state where the token is consumed and the stack is empty. This is thus a viable token to be generated.
For `7b`, this is not the case:
```
stack: [INT]
stack: [DIGITS]
stack: [[0-9], DIGITS]
token: 7b -> b
stack: [DIGITS]
stack: [[0-9]]
token: b
```
Here we are stuck and can't advance. This means the token `7b` is not suitable for our generation. We will mask this with `-inf`,
to ensure it won't be generated.

## Dealing with Non-determinism

You might still argue that we are dealing with this oracle machine, which somehow knows
if the rule `[0-9] DIGITS` or `DIGITS` is the right path. You would be right. Again, we can propose a simple solution.

Whenever there is a point, where you have to make a decision, just go both ways.

Concretely, that means that when finding a rule like `DIGITS | [0-9] DIGITS` you just fork the current stack you have
and in one go with `DIGITS`, whereas the other one will have `[0-9] DIGITS`. Checking if a token goes through
is then about answering "Is there a stack which accepts?". Since all tokens are of finite length, you don't have to care
about infinite recursion (having a stack that would always expand DIGITS branch).

And that's it! Conceptually, this is how llama.cpp works!

## Conclusion

Somehow, I very much like how constrained generation is a new problem, where we were able to apply already existing
theory to solve it in a nice, tractable way. I feel like that does not happen as often as it should.

Still, bear in mind, that the llama.cpp solution is more on the side of _slow_ solutions. As it does everything
at inference time, it does not really scale well with bigger grammars, because you could be keeping
an enormous amount of parallel stacks. In the end, you incur something like `O(vocab_size * active_stacks)` cost,
which with current vocab sizes (100k+) can be just incredibly time-consuming.

Certainly, better solutions like [XGrammar](https://github.com/mlc-ai/xgrammar) or [LLGuidance](https://github.com/guidance-ai/llguidance) exist.
I just believe that the llama.cpp approach is a good way to get into what is generally happening.
A next interesting step is going into the precomputation side of things - clearly, you don't want to do everything per step.
If you liked this, I would go for:
- reading this [incredible blog post](https://guidance-ai.github.io/llguidance/llg-go-brrr) about how LLGuidance is built,
- looking at the [outlines paper](https://arxiv.org/pdf/2307.09702) to understand what you might cache before generating,
- or [xgrammar paper](https://proceedings.mlsys.org/paper_files/paper/2025/file/5c20ca4b0b20b0bd2f1d839dc605e70f-Paper-Conference.pdf) which has nice insights into what is good to precompute.

Hopefully, it should now make at least a bit of sense! If you liked this post, consider [giving us a star](https://github.com/nobodywho-ooo/nobodywho)!

*This post was written entirely by a human. No words were made up by the machine.*

---

## Who We Are

We're NobodyWho, a local inference library, which enables running small models on edge-devices.
We value open-source code, control over your models, solid software engineering, standardization and making simple things simple.
All of which is missing in today's AI world. Running a model with us is as easy as:
```python
from nobodywho import Chat

chat = Chat("model.gguf")
answer = chat.ask("Is water wet?").completed()
print(answer)
```
If you value the same things, come and [become a contributor](https://github.com/nobodywho-ooo/nobodywho)
or just [download and test our library](https://docs.nobodywho.ooo/).
