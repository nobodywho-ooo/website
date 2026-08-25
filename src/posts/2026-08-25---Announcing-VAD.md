---
title: Announcing Voice Activity Detection
date: 2026-08-25
categories: ["Feature", "Release"]
description: "Detect when someone starts and stops speaking, on-device."
image: /assets/images/blog/2026/announcing-vad/nobodywho-voice-activity-detection.png
slug: "announcing-vad"
---

![Voice Activity Detection with NobodyWho](/assets/images/blog/2026/announcing-vad/nobodywho-vad.png)

Following our speech release, we just shipped Voice Activity Detection (VAD) in NobodyWho! 🎙️ It's available for all our bindings: Python, React Native, Flutter, Kotlin, Swift and Godot.

VAD answers a simple question: is someone speaking right now, and when did they stop?
It runs on-device through the same ONNX Runtime stack we built for Speech to Text and Text to Speech, so it shares the same accelerators, the same model download and cache, and the same offline-after-first-use behavior.
It pairs naturally with STT: use VAD to decide when a turn is over, then hand that audio to Whisper to transcribe.

## Why not a silence timeout?

The usual way to detect the end of a turn is a timer: once the microphone has been quiet for N milliseconds, assume the user is done. 
It works, but it comes with a bad tradeoff: set the timeout short and you cut people off during natural pauses, set it long and every interaction feels sluggish. A timer only measures loudness over time, it has no idea whether the sound it is hearing is speech.

VAD replaces that with a small model that was trained on the actual shape of speech.
We use [Silero VAD](https://github.com/snakers4/silero-vad) (MIT licensed), a tiny recurrent model that carries state between frames and emits a speech probability for each one.
It reliably tells speech and silence apart even against background noise, which a timeout never can.

## How it works

Silero processes audio in fixed 512-sample frames at 16kHz (32ms each) and carries a hidden state forward from one frame to the next, so it understands speech as a continuous stream rather than isolated snapshots.
Whatever sample rate you feed us gets resampled to 16kHz internally with [rubato](https://github.com/HEnquist/rubato), a streaming sinc resampler whose filter state persists across calls, so live chunks resample seamlessly.

The model itself only gives us one number per frame: the probability that this 32ms of audio is speech.
Turning that stream of probabilities into something you can actually build on is where most of the work went.

Raw probabilities flicker around the threshold, so a naive "fire when it crosses 0.5" would emit dozens of false starts and stops per second.
On top of the model we run a small debouncing state machine that adds the behavior a real application needs:

- **Hysteresis.** Speech has to cross the threshold to start, but the probability has to fall well below it before we call silence. That gap absorbs the flicker around the boundary.
- **Minimum durations.** Speech must persist briefly before we confirm a `SpeechStarted` (which filters out coughs and clicks), and silence must persist before we confirm a `SpeechEnded` (so a mid-sentence breath does not end the turn).
- **Pre-roll.** Because confirmation lags the actual onset by a few frames, we keep a short ring buffer of the audio just before speech was confirmed. When you collect a turn, the first syllable is still there instead of clipped off.

This gives you two ways to use it.
For live audio, push each chunk as it arrives and watch for `SpeechEnded`, then collect the captured turn.
For a recording you already have, hand the whole buffer to `segment()` and get back every speech segment at once.

### The good

Outside the ONNX runtime, this layer is pure Rust: `rubato` for resampling, and the debouncer and buffering are just plain code with no dependencies.
Because it rides on the inference stack we already built for speech, adding it did not pull in any new C or C++ libraries or complicate our build pipelines.
The model is tiny and cheap to run, so it comfortably sits in front of your LLM without competing for resources.

### The bad

A VAD model gives you probabilities, not decisions, and the right decision depends on the room.
We ship defaults that work in most cases, but reaching the best behavior in a noisy environment or with a particular microphone often means tuning the threshold, the minimum durations, and the pre-roll yourself.
We currently target Silero specifically, though the source is configurable so you can point it at a compatible mirror or fork.
And it inherits the same ONNX tradeoffs we wrote about with speech: Apple Silicon acceleration goes through CoreML rather than Metal, and we compile the Android runtime ourselves.

### Versions and how to update
- Python 2.0.0: `pip install --upgrade nobodywho`
- React Native 3.0.0: `npm install react-native-nobodywho@3.0.0`
- Flutter 3.0.0: bump nobodywho to `3.0.0` in `pubspec.yaml`, then `flutter pub get`
- Kotlin 3.0.0: bump `ai.nobodywho:nobodywho-android` (or `ai.nobodywho:nobodywho`) to `3.0.0`
- Swift 3.0.0: bump the NobodyWho Swift package to `3.0.0`
- Godot 10.0.0: grab the new version from the Asset Library or the GitHub releases page

If you run into issues, have feedback, or want a specific model supported, open an issue on GitHub.
If you build something with it, we would love to see it!
