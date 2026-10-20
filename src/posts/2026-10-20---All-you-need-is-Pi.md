---
title: You don’t need [insert expensive code review agent here]. All you need is Pi.
date: 2026-10-20
author: Duarte O.Carmo
categories: ["Technical"]
description: "How we replaced paid code review services with Pi, GLM 5.3, one GitHub Action and get a review we fully control."
slug: "all-you-need-is-pi"
---

![Review by Pi and GLM 5.3](/assets/images/blog/2026/all-you-need-is-pi/code-review-action-powered-by-Pi-and-GLM.png)
*Our code review action powered by Pi and GLM 5.3*

As we’re shipping out more and more code, it’s becoming increasingly hard to keep up. There’s a whole economy of code-review-as-a-service companies that are tackling that space. [CodeRabbit](https://www.coderabbit.ai), [Greptile](https://www.greptile.com), [Macroscope](https://macroscope.io), are just some of them. These are great, but they are also expensive. Additionally - in most of them, you don’t actually pay per review or lines of code, or even tokens, you pay per seat!

At [NobodyWho](https://www.nobodywho.ai), we are all about keeping control. And if we can avoid a fat bill while we are at it, we will. Instead of adopting an expensive and fancy code review service, we just use [Pi](https://github.com/earendil-works/pi-coding-agent). 

Need a review in your PR? Just comment `/ai-review` and an agent will review your code. We control the model, we control the prompt, and we control when and how it runs. 

Here’s how it works. 

## The core: Code review skill

We stole the original review skill from the [Earendil folks and their pi-review extension](https://github.com/earendil-works/pi-review) (we are big fans!). In our repo it sits right under [`.agents/skills/ai-review/SKILL.md`](https://github.com/nobodywho-ooo/nobodywho/blob/main/.agents/skills/ai-review/SKILL.md). Anyone can run that skill locally before they open a Pull Request. 

It’s a single file with code review instructions that our team can iterate on. One of the things we like the most about is that it categorizes issues according to priority: P0 (fix this now), P1 (you should fix it), etc.  

We are completely in control of what the agent reviews, and how they review it. Great - now how to we run it?

## The engine: GitHub Actions

Our [GitHub Action](https://github.com/nobodywho-ooo/nobodywho/blob/main/.github/workflows/ai-review.yml) is also extremely simple (around 300 LOC): 

1. It runs whenever someone posts `/ai-review` as a comment in a PR
2. Adds a `ai-review` label and acknowledges that it started reviewing the code
3. It gets the details and diff of the PR
4. It installs Pi
5. The code review launches using the Pi cli, our selected model from [OpenRouter](https://openrouter.ai) (we like [GLM 5.3](https://openrouter.ai/z-ai/glm-5.3)!) and using the code review skill from the main branch (to avoid prompt injection shenanigans)
6. When it’s done it [posts the review to the PR](https://github.com/nobodywho-ooo/nobodywho/pull/810#issuecomment-6145687451) as a comment
7. Finally, it [saves the review as a GitHub Action artifact we can inspect and debug](https://github.com/nobodywho-ooo/nobodywho/actions/runs/38407626876) - which uses Pi’s export functionality 

![AI transcript code review](/assets/images/blog/2026/all-you-need-is-pi/inspecting-transcript-from-an-ai-code-review.png)
*Inspecting the transcript from an AI code review run*
    

[Check our action here!](https://github.com/nobodywho-ooo/nobodywho/blob/main/.github/workflows/ai-review.yml)

## Why do we prefer this?

- **Control**: We know what model ran, we know what prompt ran, and we can change those whenever we want according to what we need.
- **Price:** We pay per review or per token. We don’t pay per seat. No subscriptions, no surprises, no rug pulls.
- **Customizability:** Want to test that new model? Go for it. Too verbose? Adjust the skill. Swarm of agents? Go nuts. Want to make it more fancy and have it comment the diff and suggest? Possible!
- **Debugability:** Thanks to GitHub Actions and Pi, we save a full transcript every time we run it. This means we can see exactly what the agent inspected and how it reasoned about it. We could even train our own code review agent in the future given the team’s feedback.
- **Simple:** One YAML file, 300 LOC. That’s all you need.

We hope some day that these can even run on local models in the future. Some argue we are almost there. And we are all about local models at [NobodyWho](https://github.com/nobodywho-ooo/nobodywho).