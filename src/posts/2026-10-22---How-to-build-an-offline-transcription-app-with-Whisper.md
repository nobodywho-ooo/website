---
title: How to build an offline transcription app with Whisper
date: 2026-10-22
author: Pierre Bresson
categories: ["Technical"]
description: "A fully offline React Native transcription app built with NobodyWho and Whisper, compared against YouTube’s own subtitles."
slug: "offline-transcription-app"
---

![Transcriber app](/assets/images/blog/2026/transcriber-app/transcriber-mobile-app.png)

At NobodyWho, we've spent the last months shipping new features, like Speech-to-Text or Voice Activity Detection, to complete our local AI stack, and now felt like a good time to run a few experiments with our software.

I decided to build a simple transcription app with React Native that you can use fully offline once you have downloaded the whisper model (small, int8 quantization). With this app, you can easily record 10+ minutes of English speech and save either the entire transcript or just the parts you are interested in. Let's take a closer look at the implementation and see how it compares to a cloud transcription service.

## Recording and transcription

The interface is straightforward: a button to start the recording and a timer, with the first sentences appearing as soon as they are processed. Let's have a look at what happens when the user presses the recording button:

![Recording screen](/assets/images/blog/2026/transcriber-app/recording-screen.png)

1. First the OS asks permission for microphone access.
2. Then the audio streaming starts and the stream of audio buffers arrives.
3. Each buffer is processed by `transcribeChunk` (via `onChunk`), which calls NobodyWho's `.transcribePcm` method and returns the corresponding text. Since Whisper by default, returns non-verbal human sounds like coughs, laughs, yawning and so on, we remove them from the transcription (see `cleanText`).
4. When the user presses the stop button, we stop the recording and wait for any queued chunks to be processed thanks to `pendingRef`.

Here is what the simplified streaming process with buffers looks like in the app:

```ts
const { stream } = useAudioStream({
  sampleRate: SAMPLE_RATE,
  channels: 1,
  encoding: 'int16',
  onBuffer: buffer => {
    if (!chunkerRef.current) {
      chunkerRef.current = new Chunker(buffer.sampleRate, onChunk);
    }

    chunkerRef.current.push(toMonoInt16(buffer)); // .push() also calls onChunk
  },
});

const start = async () => {
  await requestRecordingPermissionsAsync();
  await stream.start();
};

const onChunk = (chunk: AudioChunk) => {
  const index = chunksRef.current.length;
  const live: LiveChunk = { start: chunk.start, end: chunk.end, text: null };
  chunksRef.current = [...chunksRef.current, live];

  const job = transcribeChunk(chunk)
    .then(text => {
      chunksRef.current = chunksRef.current.map((c, i) =>
        i === index ? { ...c, text } : c,
      );

      setChunks(chunksRef.current);
    });

  pendingRef.current.push(job);
};

const transcribeChunk = async (chunk: AudioChunk): Promise<string> => {
  const text = await whisperModel.transcribePcm(chunk.samples, chunk.sampleRate).completed();
  return cleanText(text);
}
```

Once the job queue is empty, the user is redirected to the Transcript screen where they can see the full transcript, export or listen to each chunk individually or compact them into one audio and text file:

![Transcript screen](/assets/images/blog/2026/transcriber-app/transcribe-screen.png)

## Results and comparison

Alright, but how does it compare to other transcription tools? Since I'm French and my English is well, not the best as you can imagine, I often use subtitles on YouTube videos. Therefore I did a little comparison, using latest [MKBHD tech review](https://www.youtube.com/watch?v=ESABTN4VtrA) of the iPhone Duo:

**YouTube transcript**

> First-generation devices are always the most fun to review. And for the past, like, month, everyone I talk to has been asking me, "What do you think of the iPhone Duo? Like, should I get a foldable iPhone?? Is that for me? Who is it even really for?? You've been testing it for the past week, right?? Yeah... So most new pieces of tech are fundamentally like a solid idea at their core. And then they can be a little bit rough around the edges, but that'll get better over time. The iPhone Duo specifically, as the first folding iPhone, is very polished around the edges, but kind of rough in the middle, if that makes sense.

**App transcript**

> First generation devices are always the most fun to review. And for the past like month everyone I've talked to has been asking me, "What do you think of the iPhone Duo? Should I get a foldable iPhone? Is that for me? Who is it even really for?" You've been testing it for the past week, right? Yeah. So most new pieces of tech are fundamentally like a solid idea at their core and then they can be a little bit rough around the edges but that'll get better over time. The iPhone Duo specifically as the first folding iPhone is very polished around the edges but kind of rough in the middle if that makes sense.

The differences are minor. A "like" has been omitted by the Transcriber app, "I've talked" isn't correct in the Youtube transcript and punctuation is sometimes better in one version and sometimes in the other one, that's it!

This app has been vibe-coded and manually adjusted in half a day. It obviously needs more polishing, but it clearly shows potential for being a solid alternative to paid-per-token, cloud based solutions.

Adding Voice Activity Detection ([VAD](https://docs.nobodywho.ooo/js/voice-activity-detection)) would be a nice way to visually separate chunks of text, and using another more powerful whisper model (medium, large... with less quantization) would also improve results.

For more details, you can find the [app’s repo on GitHub](https://github.com/pielouNW/transcribe-app) where you can download the Android apk to test it on your phone.

What exciting new AI features would you like to see in NobodyWho's upcoming releases? Support for decision or diffusion models? Please let us know in the [discussion section](https://github.com/nobodywho-ooo/nobodywho/discussions), or open an issue :)