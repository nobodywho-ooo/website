---
title: LLM inference vs. the OOM killer
date: 2026-09-14
author: Mads Marquart
categories: ["Rust", "Technical"]
description: "TODO."
slug: "inference-oom"
---

There's many... let's call them "fun challenges" with running LLM inference on mobile devices. A major one is the limited amount of RAM the device has, which of course restricts which models you can run (they're called _Large_ language models for a reason), but also influences how you'd design an application around them.

Today we'll look

xyz [^sponsored].

[^sponsored]: Don't @ me, I'm writing this on the clock, gotta wedge the company name in here somehow ;)

Turns out, what's happening is that Android and iOS have Out Of Memory deamons (coliquially the OOM killer) that monitor the system and terminates background applications[^swap] when it needs to free up memory.

[^swap] From my testing, Android does have swap, but only foreground applications are allowed to use that (it's terrible for performance, so you don't really want to, but hey), background applications are still killed if they use too much memory.

This is undesirable.

Both OSes also have signals that fire beforehand that the app can listen for and respond accordingly:

iOS: https://developer.apple.com/documentation/uikit/responding-to-memory-warnings

Android: https://developer.android.com/topic/performance/memory/manage-app-memory#release

We should probably handle these events and gracefully shut down the Chat session (and probably at some point write docs for how users should do it too).

I've confirmed that iOS does issue `UIApplicationDidReceiveMemoryWarningNotification`, twice even, before killing the app outright.

So I got to thinking: Can we automatically unload the model when we get a memory warning?


## Detecting memory warnings in a Rust library

You can listen for .

On iOS[^tvos-visionos], it's _fairly_ simple (all things considered); you add a few `objc2` dependencies, and listen for the memory warning notification on the notification center:

[^tvos-visionos]: And tvOS and visionOS, Apple's OSes are pretty similar in this regard.

```toml
# Cargo.toml
[target.'cfg(any(target_os = "ios", target_os = "tvos", target_os = "visionos"))'.dependencies]
block2 = "0.6.2"
objc2 = "0.6.4"
objc2-foundation = { version = "0.3.1", default-features = false, features = [
    "std",
    "block2",
    "NSString",
    "NSOperation",
    "NSNotification",
] }
objc2-ui-kit = { version = "0.3.1", default-features = false, features = [
    "std",
    "UIApplication",
    "UIResponder",
] }
```

```rust
// src/main.rs
#![cfg(any(target_os = "ios", target_os = "tvos", target_os = "visionos"))]
use block2::RcBlock;
use objc2::MainThreadMarker;
use objc2::rc::Retained;
use objc2::runtime::ProtocolObject;
use objc2_foundation::{NSNotificationCenter, NSObjectProtocol, NSOperationQueue};
use objc2_ui_kit::{UIApplication, UIApplicationDidReceiveMemoryWarningNotification};

/// Will remove the observer on `Drop`.
#[derive(Debug)]
pub struct MemoryWarningListener {
    _observer: Retained<ProtocolObject<dyn NSObjectProtocol>>,
}

impl MemoryWarningListener {
    pub fn register(callback: impl Fn() + Send + Sync + 'static) -> Self {
        let center = NSNotificationCenter::defaultCenter();

        // SAFETY: `callback` is `Send + Sync`, so we can safely pass it to the main thread.
        let _observer = unsafe {
            center.addObserverForName_object_queue_usingBlock(
                Some(UIApplicationDidReceiveMemoryWarningNotification),
                // No sender filter
                None,
                // Run on the main thread.
                Some(&NSOperationQueue::mainQueue()),
                &RcBlock::new(move |_| callback()),
            )
        };

        Self { _observer }
    }
}

fn main() {
    let _listener = MemoryWarningListener::register(|| {
        println!("got memory warning");
    });

    // Run the application however.
    let mtm = MainThreadMarker::new().unwrap();
    UIApplication::main(None, None, mtm)
}
```

Note that running a runloop is necessary for the notification to fire (hence the `UIApplication::main()` call in the example above).

<video src="/assets/videos/blog/2026/inference-oom/memory-warning.mp4" width="1280" height="1000" controls muted playsinline aria-label="Video of running the code in the iPhone Simulator, and simulating a memory warning.">
  Video of running the code in the iPhone Simulator, and simulating a memory warning.
</video>

I hoped that it'd be the same story on Android, but it's... hard to get the [`Application`] object on Android.
- https://github.com/jni-rs/jni-rs/issues/421
- https://stackoverflow.com/questions/2002288/static-way-to-get-context-in-android

Thinking about the problem a bit more though, it occurred to me that you probably don't want the library to do this for you automatically anyhow. For example, your application might load multiple models, let's say a smaller one for background tasks and a larger one for specialty work. In that case, you probably want to initially unload the larger model when you receive a memory a warning, and only unload the smaller one the second time you get a warning.


## Handling it at the application level

So that leads us to the better approach: handling these warning at the application level.

If you use [`winit`](https://docs.rs/winit/), or something that builds on Winit like Bevy, you can do this :

```rust

```


## ...
