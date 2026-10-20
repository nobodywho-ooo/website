---
title: Not Every GGUF Runs in llama.cpp
date: 2026-10-20
author: Pierre Bresson
categories: ["Technical"]
description: "A .gguf extension does not mean llama.cpp can load the file. How to check the architecture in a GGUF file before downloading it."
slug: "not-every-gguf-runs-in-llamacpp"
hideInBlog: true
---

MiniMax released open weights for [H3](https://huggingface.co/MiniMaxAI/MiniMax-H3) on 3 August. H3 is a 33B model that generates video with stereo audio, at 768p by default.

Community repos on Hugging Face publish H3 as GGUF files. [One repo’s](https://huggingface.co/Abiray/MiniMax-H3-GGUF) H3 files range from 15.6 to 36 GB. [Another repo](https://huggingface.co/molbal/MiniMax-H3-GGUF) publishes pruned versions from 11.4 GB.

GGUF is also the file format llama.cpp uses for language models. A .gguf extension does not mean llama.cpp can load the file. One H3 repo lists the architecture as `minimax_h3`. A test file with that architecture fails in llama.cpp with this error:

`llama_model_load: error loading model: unknown model architecture: 'minimax_h3'`

Other tools now check for this case. [Unsloth Studio’s 14 August release](https://github.com/unslothai/unsloth/releases/tag/v0.1.800-beta) refuses image and video GGUF files before it starts llama-server. The molbal/MiniMax-H3-GGUF repo states that two of its formats “will probably not work elsewhere” than its ComfyUI custom nodes.

## What a GGUF File Contains

A GGUF file has four parts, in this order:

1. Header: the magic bytes GGUF, a version number, a tensor count and a metadata count.

2. Metadata: a list of key-value pairs.

3. Tensor descriptions: the name, shape and type of each tensor.

4. Tensor data, padded to an aligned offset.

The layout does not define the model type. Any project can store any model in it. The ComfyUI-GGUF custom nodes, for example, use GGUF for image and video models.

The metadata key `general.architecture` identifies the model architecture. llama.cpp, ComfyUI-GGUF and Unsloth Studio all read this key to decide how to handle a file. [Our May post](https://www.nobodywho.ai/posts/whats-in-a-gguf/) covers other GGUF metadata: chat templates, special tokens and sampler settings.

## How llama.cpp Checks the Architecture

llama.cpp compares `general.architecture` with a fixed list in [src/llama-arch.cpp](https://github.com/ggml-org/llama.cpp/blob/08698c81ed1053b7be1ade00d1e127daf1ae9ba3/src/llama-arch.cpp). At commit 08698c8 (15 October 2026), the list has 156 model architectures. If the value is not on the list, loading stops.

The list includes three MiniMax language models: `minimax-01`, `minimax-m2` and `minimax-m3`. It does not include `minimax_h3`. A vendor name in a filename does not show whether llama.cpp supports the file.

Some H3 GGUF files carry no architecture name at all. [Unsloth’s own code](https://github.com/unslothai/unsloth/blob/7790e1b308e28f179f79be36a29e1413af402a33/studio/backend/core/inference/llama_cpp.py) says its MiniMax-H3 GGUFs “carry a bare tensor header with zero KV pairs”, and Hugging Face’s GGUF parser reports no architecture for the [unsloth/MiniMax-H3-GGUF](https://huggingface.co/unsloth/MiniMax-H3-GGUF) repo. A test file with no metadata fails in llama.cpp with this error:

`llama_model_load: error loading model: unknown model architecture: ''`

A supported architecture name is required, but it is not enough on its own. Each architecture also requires specific metadata keys. A test file with `general.architecture` set to `llama` and no other keys fails with this error:

`llama_model_load: error loading model: error loading model hyperparameters: key not found in model: llama.context_length`

ComfyUI-GGUF runs the same check against its own list. It rejects image and video files with an architecture that is not on the list. `minimax_h3` is on the list in [molbal’s fork](https://github.com/molbal/ComfyUI-GGUF) of ComfyUI-GGUF. It is not on the list in the [upstream city96 repo](https://github.com/city96/ComfyUI-GGUF).

## How to Check a File Before Downloading It

The architecture is stored in the metadata at the start of the file. Reading it does not require the full download.

Option 1: open the file on Hugging Face. The [GGUF viewer](https://huggingface.co/docs/hub/gguf) on the model and file pages shows the metadata.

Option 2: run the script below. It uses HTTP range requests, which Hugging Face file URLs accept. It fetches 1 MB at a time until the metadata ends. It needs only the Python standard library.

```
# gguf_peek.py: print a GGUF file's metadata without downloading the weights.
# Usage: python gguf_peek.py https://huggingface.co/<repo>/resolve/main/<file>.gguf
import struct, sys, urllib.error, urllib.request
 
URL = sys.argv[1]
buf, pos = bytearray(), 0
 
def need(n):
    # Fetch 1 MB ranges until the buffer covers the next n bytes.
    while len(buf) < pos + n:
        rng = f"bytes={len(buf)}-{len(buf) + (1 << 20) - 1}"
        req = urllib.request.Request(URL, headers={"Range": rng})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                if r.status != 206:
                    sys.exit("Server ignored the Range header.")
                chunk = r.read()
        except urllib.error.HTTPError as e:
            if e.code == 416:
                sys.exit("File ended before the metadata did.")
            sys.exit(f"HTTP {e.code}: {e.reason}")
        if not chunk:
            sys.exit("File ended before the metadata did.")
        buf.extend(chunk)
 
def take(fmt):
    global pos
    size = struct.calcsize("<" + fmt)
    need(size)
    (v,) = struct.unpack_from("<" + fmt, buf, pos)
    pos += size
    return v
 
def string():
    global pos
    n = take("Q")
    need(n)
    pos += n
    return bytes(buf[pos - n:pos]).decode("utf-8", "replace")
 
SCALAR = {0: "B", 1: "b", 2: "H", 3: "h", 4: "I", 5: "i", 6: "f",
          7: "?", 10: "Q", 11: "q", 12: "d"}
 
def value(t):
    if t == 8:
        return string()
    if t == 9:
        item, n = take("I"), take("Q")
        for _ in range(n):
            value(item)
        return f"[array of {n}]"
    return take(SCALAR[t])
 
need(4)
if bytes(buf[:4]) != b"GGUF":
    sys.exit("Not a GGUF file.")
pos = 4
version = take("I")
if version not in (2, 3):
    sys.exit(f"Unsupported GGUF version {version}.")
n_tensors, n_kv = take("Q"), take("Q")
print(f"GGUF v{version}, {n_tensors} tensors, {n_kv} metadata keys")
for _ in range(n_kv):
    key = string()
    v = value(take("I"))
    print(f"{key} = {v!r:.80}")
print(f"Fetched {len(buf):,} bytes.")
```

Usage:

```
python gguf_peek.py https://huggingface.co/<repo>/resolve/main/<file>.gguf
```

Example output from a test file:

```
GGUF v3, 2 tensors, 2 metadata keys
general.architecture = 'minimax_h3'
general.name = 'MiniMax-H3 test file'
Fetched 320 bytes.
```

Search for the `general.architecture` value in `src/llama-arch.cpp`. If the value is not there, llama.cpp cannot load the file. If the script prints no `general.architecture` line, llama.cpp cannot load the file either.

For a model split across several files, run the script on the first file. Only the first file contains `general.architecture`.

[NobodyWho](https://github.com/nobodywho-ooo/nobodywho) loads models through llama.cpp, so the same rule applies: if the architecture is not in src/llama-arch.cpp, NobodyWho cannot run the file either. It runs GGUF language models locally and offline, with bindings for Python, Flutter, React Native, Swift, Kotlin and Godot.