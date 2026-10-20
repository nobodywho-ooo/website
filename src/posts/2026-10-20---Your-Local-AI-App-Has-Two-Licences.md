---
title: Your Local AI App Has Two Licences
date: 2026-10-20
author: Pierre Bresson
categories: ["Technical"]
description: "Local AI apps ship a model licence and an engine licence. A checklist for territories, revenue thresholds, attribution and copyleft before shipping."
slug: "your-local-ai-app-has-two-licences"
hideInBlog: true
---

MiniMax publishes open weights for H3 on [Hugging Face](https://huggingface.co/MiniMaxAI/MiniMax-H3). H3 is an omni-modal model that generates video with audio. Its core is a 33B-parameter transformer. Anyone can download the files, but the [MiniMax H3 Community License Agreement](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE), dated 2 August 2026, does not authorise their use in the European Union, the United Kingdom, South Korea or the United States.

Open weights with a border check are becoming a pattern. Meta did it earlier with Llama 3.2, whose [use policy](https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/USE_POLICY.md) withholds its multimodal models from individuals domiciled in the European Union and from companies with their principal place of business there, though end users of apps built on them are still let in. MiniMax covers more ground, with four excluded territories instead of one, and adds a revenue threshold for products earning more than \$20 million a year.

NobodyWho is a Copenhagen company, so we read our own licence too. The [EUPL-1.2](https://interoperable-europe.ec.europa.eu/collection/eupl/introduction-eupl-licence) was created on the initiative of the European Commission, it grants a “worldwide” licence, it comes in 23 EU languages that all carry equal legal value, and it asks nothing about revenue or funding. It also works in the European Union, which is more than the H3 licence can say.

A local AI app ships at least two licensed components: the model weights and the inference engine that runs them. Each has its own licence, and both apply at the same time. This checklist covers both.

## Part 1: The Model Licence

Read the LICENSE file in the model repo. The H3 licence contains each of these terms.

1. **Territory.** The licence defines the “Applicable Territory” as “worldwide, excluding the Excluded Territories”, and names those as “the European Union, the United Kingdom, the Republic of Korea and the United States of America.” Section V.4 says use outside the Applicable Territory “is not authorized by this Agreement.”

2. **Revenue thresholds.** Section IV.1 applies “if your commercial products and services generate more than 20 million US dollars (or equivalent in other currencies) in yearly revenue.” Above that level, the licensee must first get “a separate, prior written authorization from MiniMax”.

3. **Attribution.** A commercial product must “prominently display ‘MiniMax H3’ on the user interface”. Copies distributed to third parties, other than through hosted services, must also include a NOTICE file with MiniMax’s licence and copyright line.

4. **Acceptable use policy.** The licence includes an acceptable use policy by reference. MiniMax “reserves the right to update” that policy. Check the current version before each release.

## Part 2: The Engine Licence

The engine licence decides who can use the engine for free. It also sets what a developer must do when shipping it.

1. **Who the free licence covers.** Some on-device engines limit the free licence by funding and revenue. [Cactus’s licence](https://github.com/cactus-compute/cactus/blob/main/LICENSE) grants it to organisations with both “Less than \$2,000,000 USD in total funding” and “Less than \$2,000,000 USD in gross annual revenue”. [RunAnywhere’s licence](https://github.com/RunanywhereAI/runanywhere-sdks/blob/main/LICENSE) uses the same two tests at “\$1,000,000 USD”. Both require a commercial licence within 30 days of passing either threshold. Full comparisons are in [NobodyWho vs Cactus](https://www.nobodywho.ai/posts/nobodywho-vs-cactus/) and [NobodyWho vs RunAnywhere](https://www.nobodywho.ai/posts/nobodywho-vs-runanywhere/).

2. **Obligations when shipping.** Copyleft licences set terms for distributing the engine. Under [EUPL-1.2](https://github.com/nobodywho-ooo/nobodywho/blob/main/LICENSE), copies of the original or a modified engine must be distributed under the EUPL or a later version of it. A compatibility clause covers works that combine the engine with code under certain other licences. The distributor must also provide the source code or “indicate a repository where this Source will be easily and freely available”.

3. **Attribution.** The Cactus, RunAnywhere and EUPL licences all require the copyright notice in distributed copies.

## Before Shipping

Run these checks for the model and for the engine:

1. Read the LICENSE file itself. Package metadata can disagree with it.

2. Compare any funding, revenue or user thresholds with the company’s current figures.

3. Check the territories where the app will be used.

4. List the attribution each licence requires.

5. Check the obligations for distributing modified code.

6. Repeat the checks on every upgrade. Licence files can change between versions.

This checklist is not legal advice.

## NobodyWho’s Licence

[NobodyWho](https://github.com/nobodywho-ooo/nobodywho) uses EUPL-1.2, an [OSI-approved](https://opensource.org/license/eupl-1-2) open source licence. Its grant is “worldwide”, so the same terms apply in Copenhagen, London, Seoul and San Francisco, one city in each territory the H3 licence leaves out, and it has no revenue or funding condition. The README states:

*NobodyWho is licensed under the EUPL-1.2. You may use it in proprietary and commercial projects, free of charge.*

It also states:

*If you distribute modified versions of the code in this repo, you must open source those changes.*

The full licence section is in the [README on GitHub](https://github.com/nobodywho-ooo/nobodywho#license). Installation steps for each framework are in the [NobodyWho docs](https://docs.nobodywho.ai/).
