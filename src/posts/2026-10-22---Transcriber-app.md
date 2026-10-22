---
title: How to build a simple transcription app
date: 2026-10-22
author: Pierre Bresson
categories: ["Technical"]
description: ""
slug: "transcriber-app"
---

![Transcriber app](/assets/images/blog/2026/transcriber-app/transcriber-mobile-app.png)

At NobodyWho, we've spent the last months shipping a bunch of new cool features like Speech to Text or Voice Activity Detection to complete our local AI stack, and now feels like a good time to do little experiments around our software.

I have decided to build a simple transcription app, that you can use fully offline once you have downloaded the whisper model. With it, you can easily record an english speech of 10+ minutes and download the transcription entirely, or just the parts you are interested in. Let's have a look at the implementation and see how it is this done.

## Recording and transcription

The interface is straightforward, a button to start the recording and a timer, and the first sentences appearing as soon as they are processed. Let's have a look to what happens when the user press the recording button:

![Recording screen](/assets/images/blog/2026/transcriber-app/recording-screen.png)

1. First the OS is asking permission for microphone access
2. Then the audio streaming starts and the stream of audio buffers arrives
3. Each buffer is processed by onChunk, which is calling NobodyWho `.transcribePcm` method and return the corresponding text. Since Whisper is by default returning non-verbal human sounds like coughs, laughs, yawning and so, we remove from the transcription.
4. When the user press the stop button, we stop the recording and wait for any queued chunk to be processed thanks to `pendingRef`.

Here is how the simplified streaming process with buffers looks like:

```ts
const start = async () => {
  const permission = await requestRecordingPermissionsAsync();
  await stream.start();
};

const { stream } = useAudioStream({
  sampleRate: SAMPLE_RATE,
  channels: 1,
  encoding: 'int16',
  onBuffer: buffer => {
    if (!chunkerRef.current) {
      chunkerRef.current = new Chunker(buffer.sampleRate, onChunk);
    }

    chunkerRef.current.push(toMonoInt16(buffer));
  },
});

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

const transcribeChunk(chunk: AudioChunk): Promise<string> {
  const text = await whisperModel.transcribePcm(chunk.samples, chunk.sampleRate).completed();
  return cleanText(text);
}
```

Once the job queue is empty, the user is redirected to the Transcript screen where he can see the full transcript, export or listen to each chunks individually or compacted in one audio and text file:

![Transcript screen](/assets/images/blog/2026/transcriber-app/transcribe-screen.png)

## Results and comparison

Alright, but how does it compare to other transcription tools? Since I'm french and that my english is well, not the best as you can imagine, so I often use subtitles on Youtube videos. Therefore I did a little comparison, using latest [MKDBHD tech review](https://www.youtube.com/watch?v=ESABTN4VtrA) of the iPhone Duo:

**Youtube transcript**

> First-generation devices are always the most fun to review. And for the past, like, month, everyone I talk to has been asking me, "What do you think of the iPhone Duo? Like, should I get a foldable iPhone?? Is that for me? Who is it even really for?? You've been testing it for the past week, right?? Yeah... So most new pieces of tech are fundamentally like a solid idea at their core. And then they can be a little bit rough around the edges, but that'll get better over time. The iPhone Duo specifically, as the first folding iPhone, is very polished around the edges, but kind of rough in the middle, if that makes sense.

**Transcriber app transcript**

> First generation devices are always the most fun to review. And for the past like month everyone I've talked to has been asking me, "What do you think of the iPhone Duo? Should I get a foldable iPhone? Is that for me? Who is it even really for?" You've been testing it for the past week, right? Yeah. So most new pieces of tech are fundamentally like a solid idea at their core and then they can be a little bit rough around the edges but that'll get better over time. The iPhone Duo specifically as the first folding iPhone is very polished around the edges but kind of rough in the middle if that makes sense.

The differences are minimal, a "like" has been omitted by the Transcriber app and punctuation is sometimes better in one version and sometimes better in the other one, but that's it!

This app has been vibe coded and manually ajusted in a half a day, would need adjustements and improvements, but it's already showing potential for being a solid alternative to paid per token cloud based solutions.

Adding a Voice Activity Detection ([VAD](https://docs.nobodywho.ooo/js/voice-activity-detection)) would better a nice way to visually separete chunks of text and using another more powerful whisper model (medium, large... with better quantization) would also improve results.

For more details, you can find the repo of the app [here](https://github.com/pielouNW/transcribe-app) and you can even download the android apk to test it on your phone!

What exciting new AI features would you like to see in NobodyWho's incoming releases? Support for decision model? Image generation? Please let us know in the [discussion section](https://github.com/nobodywho-ooo/nobodywho/discussions), or open an issue :)