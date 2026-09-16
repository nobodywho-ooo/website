---
title: LLM inference vs. the OOM killer
date: 2026-09-14
author: Mads Marquart
categories: ["Rust", "Technical"]
description: "Mobile memory warnings and handling them in Rust."
slug: "inference-oom"
---

There's many... let's call them "fun challenges" with running LLM inference on mobile devices. A major one is the limited amount of RAM the device has, which of course restricts which models you can run (they're called _Large_ language models for a reason), but also influences how you design an application using them.

The thing I'll be looking at today is an issue that we're having in the [NobodyWho Chat](/apps/) app[^sponsored], our test app for the open-source Rust inference library we're building: It sometimes crashes after you background the app, which is quite a bad user-experience.

Investigating, I found that the culprit is the Out Of Memory deamon (coliquially OOM killers) that both Android and iOS have, which monitors the system and terminates background applications when the system needs free memory.[^swap]

You can see this crash here where I load a 1GB model running on an Android emulator with `hw.ramSize=2G` and then open another memory hungry application:[^miss]

<video src="/assets/videos/blog/2026/inference-oom/android-lowmemorykiller.mp4" width="2060" height="1440" controls muted playsinline aria-label="Video of NobodyWho Chat crashing on Android when opening Chrome, and the log message from the lowmemorykiller.">
  Video of NobodyWho Chat crashing on Android when opening Chrome, and the log message from the lowmemorykiller.
</video>

Luckily, both OSes also have signals that fire beforehand that the app can listen for, and respond accordingly:
- iOS/tvOS/visionOS: [`applicationDidReceiveMemoryWarning:`](https://developer.apple.com/documentation/uikit/responding-to-memory-warnings). Seems to be sent twice before killing the app.
- Android: [`ComponentCallbacks2.onTrimMemory`](https://developer.android.com/topic/performance/memory/manage-app-memory#release). Seems to be sent once or twice before killing the app.

So I got to thinking: Could our library register for these signals, and automatically unload the model when they fire?


## Detecting memory warnings in a Rust library

On iOS, it's _fairly_ simple (all things considered) to listen for this signal in a library; you add a few `objc2` dependencies, and add an observer on the memory warning notification:

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
        // Unload the model here.
    });

    // Run the application. This is necessary for the notification to fire.
    // Alternatively you could be starting Winit or Bevy etc.
    let mtm = MainThreadMarker::new().unwrap();
    UIApplication::main(None, None, mtm)
}
```

Running this example in the iPhone Simulator, you'll see something like this:

<video src="/assets/videos/blog/2026/inference-oom/memory-warning.mp4" width="2038" height="1592" controls muted playsinline aria-label="Video of running the code in the iPhone Simulator, and simulating a memory warning.">
  Video of running the code in the iPhone Simulator, and simulating a memory warning.
</video>

I hoped that it'd be roughly the same story on Android, but it's... [annoying](https://stackoverflow.com/questions/2002288/static-way-to-get-context-in-android) to get the [`Application`](https://developer.android.com/reference/android/app/Application) object that we need to register the callback on. You could probably do it using [`ndk-context`](https://crates.io/crates/ndk-context), but that has [problems](https://github.com/jni-rs/jni-rs/issues/421).

And even if you managed to get the application, it doesn't seem to be possible to create a custom class dynamically with Android's Java runtime, so you'd still need some sort of Java glue code (which would kinda invalidate the whole "handle it in the library" motivation).

I'm less experienced with Android though, curious if someone knows of a better way?

---

Anyhow, thinking about the problem a bit more, it occurred to me that you might not actually want the library to do this automatically?

For example, your application might load multiple models, let's say a smaller one for background tasks and a larger one for specialty work. In that case, you'd probably rather initially unload the larger model, and only unload the smaller one the second time you get a warning.


## Handling it at the application level

So that leads us to what is probably a better approach: handling these warning at the application level[^docs].

If you use [`winit`](https://docs.rs/winit/), or something that builds on Winit like Bevy, you can handle the [`ApplicationHandler::memory_warning`](https://docs.rs/winit/0.30.13/winit/application/trait.ApplicationHandler.html#method.memory_warning) event:

```rust
use winit::application::ApplicationHandler;
use winit::event::WindowEvent;
use winit::event_loop::{ActiveEventLoop, ControlFlow, EventLoop};
use winit::window::{Window, WindowId};

#[derive(Default)]
struct App {
    window: Option<Window>,
}

impl ApplicationHandler for App {
    // ... the usual Winit event handling in here ...

    fn memory_warning(&mut self, event_loop: &ActiveEventLoop) {
        println!("got memory warning");
        // Unload the model here.
    }
}

fn main() {
    let event_loop = EventLoop::new().unwrap();
    let mut app = App::default();
    event_loop.run_app(&mut app);
}
```

For our library, to make this easy to do will probably mean we need some sort of internal state-machine and a set of `Chat.unload` and `Chat.load` methods, perhaps with all other methods implicitly loading the model if it's unloaded?

Welp, I've been writing this blog post for long enough and procrastinating actually doing ^, gotta get back to it, cya next time!


[^sponsored]: Don't @ me, I'm writing this on the clock, gotta wedge the company name in here somehow ;)

[^swap]: From my testing, Android does have swap, but only foreground applications really get to use that (and it's terrible for performance, so you don't really want to, but hey), background applications are still killed if they use too much memory.

[^miss]: Yes, I missed the gesture bar the first time, laugh all you want, it's not easy with a mouse pointer okay!

[^docs]: And documenting how to do it well.
