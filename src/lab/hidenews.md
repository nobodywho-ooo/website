---
date: 2026-11-27
title: Hide News
description: "Hide Hacker News stories about AI using an AI"
url: https://github.com/nw-ooo/hidenews
image: /assets/images/lab/hidenews.png
---

Hacker News is kinda filled with AI news nowadays, which can be tiring[^1]. So, hear me out, what if we... Used an AI to filter out the AI!

<video src="/assets/videos/lab/hidenews/hidenews.mp4" width="1600" height="1330" controls playsinline preload="metadata" aria-label="Chrome with the Hide News extension installed, scrolling the Hacker News front page as a few AI-related stories are filtered out.">
  Chrome with the Hide News extension installed, scrolling the Hacker News front page as a few AI-related stories are filtered out.
</video>

This uses the Laya decision model, and runs entirely in the browser extension (the demo video is of Chrome, since that's the throwaway browser I had lying around [#firefoxmasterrace](https://youtu.be/dQw4w9WgXcQ)).

As you can see, in practice, it doesn't really work that well, in part because the model isn't smart enough[^2], in part because there isn't enough information in the title alone to conclude whether something will be about AI, and in part because an actual filtering function for hiding AI on Hacker News would just be `stories.filter(|_| false)`, but I thought it was a fun experiment.

[^1]: And all sorts of other stuff, but I won't _delve_ into that here ;).

[^2]: And doesn't know that certain terms like "bonsai" or "Nvidia" are nowadays related to AI.
