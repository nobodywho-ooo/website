---
title: Announcing decision models
date: 2026-10-30
author: NobodyWho Team
categories: ["Feature", "Release"]
description: "Fast, private classification with typed answers. Now in every NobodyWho binding."
image: /assets/images/blog/2026/announcing-decision-models/decision-models.png
slug: "announcing-decision-models"
---

<video src="/assets/videos/blog/2026/announcing-decision-models/decision-models.mp4" poster="/assets/images/blog/2026/announcing-decision-models/decision-models-poster.webp" width="1920" height="1080" controls playsinline preload="metadata" style="border-radius: 12px;" aria-label="Announcing decision models in NobodyWho: fast, private and open source. Each question type, choice, noul and score, explained on one customer message. Available in every binding."></video>

We are happy to announce that [NobodyWho](https://github.com/nobodywho-ooo/nobodywho) now supports decision models!

Decision models were recently popularized by the release of [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev). They are general-purpose classifiers. Instead of writing a long prompt or using [structured outputs](https://docs.nobodywho.ai/python/sampling#structured-output), you define a set of criteria and let the model score them.

Our implementation sits on top of the great work from the [llama.cpp](https://github.com/ggml-org/llama.cpp) team. We currently support [Laya](https://huggingface.co/ggml-org/Laya-GGUF) decision models and three types of questions:

- `choice` picks one option and gives the probability of each one.
- `noul` gives the probability that the answer is yes.
- `score` rates something on a scale you define.

Here's a short example in Python:

```python
from nobodywho import Decision, Model

model = Model(model_path="hf://ggml-org/Laya-GGUF/Laya-Q8_0.gguf")
decisions = Decision(model=model, n_ctx=1024)

result = decisions.decide(
    state="Customer message: I was charged twice for my order last week and nobody has replied.",
    questions={
        "route": {
            "type": "choice",
            "instructions": "Choose the best team for this customer message.",
            "criteria": {
                "billing": "payments, charges, refunds, invoices",
                "shipping": "delivery, tracking, lost or late parcels",
                "technical": "bugs, errors, login problems",
            },
        },
        "angry": {"type": "noul", "instructions": "Is the customer angry?"},
        "urgency": {
            "type": "score",
            "instructions": "How urgent is this?",
            "criteria": ["can wait", "this week", "today", "right now"],
        },
    },
)

route = result["answers"]["route"]
print(f"Team: {route['choice']}")
for team, probability in route["probabilities"].items():
    print(f"  Probability of {team}: {probability:.1%}")

angry = result["answers"]["angry"]
print(f"Probability the customer is angry: {angry['noul']:.1%}")

urgency = result["answers"]["urgency"]
print(f"Urgency score: {urgency['score']:.2f} (0 = can wait, 3 = right now)")
for level, probability in urgency["probabilities"].items():
    print(f"  Probability of {urgency['legend'][level]}: {probability:.1%}")
```

Output:

```text
Team: billing
  Probability of billing: 97.4%
  Probability of shipping: 1.5%
  Probability of technical: 1.1%
Probability the customer is angry: 78.6%
Urgency score: 1.90 (0 = can wait, 3 = right now)
  Probability of can wait: 4.0%
  Probability of this week: 46.7%
  Probability of today: 4.9%
  Probability of right now: 44.4%
```

To learn more, visit the docs for the language you prefer:

- [Python](https://docs.nobodywho.ai/python/main/decision-models)
- [Godot](https://docs.nobodywho.ai/godot/main/decision-models)
- [Flutter](https://docs.nobodywho.ai/flutter/main/decision-models)
- [Kotlin](https://docs.nobodywho.ai/kotlin/main/decision-models)
- [Swift](https://docs.nobodywho.ai/swift/main/decision-models)
- [React Native](https://docs.nobodywho.ai/js/main/decision-models)

<small>Music in the video: "Beauty Flow" by Kevin MacLeod (incompetech.com), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).</small>
