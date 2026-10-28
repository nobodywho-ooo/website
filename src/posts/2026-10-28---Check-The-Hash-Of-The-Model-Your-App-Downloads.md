---
title: Check the hash of the model your app downloads
date: 2026-10-28
author: Pierre Bresson
categories: ["Technical"]
description: "Go hardcoded the hashes of eMudhra's cracked CA keys. An app that downloads a model can pin the model file's SHA-256 the same way."
slug: "check-the-hash-of-the-model-your-app-downloads"
hideInBlog: true
---

In October, it came out that eight of eMudhra’s intermediate certificate authorities had private keys that anyone could work out. [Scott Helme](https://scotthelme.co.uk/eight-bits-of-trust-emudhras-ca-keys-cracked-in-milliseconds/) pulled all eight keys out of the public certificates in less than a second, and he reports that one of them is simply the number 4.

eMudhra’s [comments](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449) on Mozilla’s bug tracker put it down to what appears to be a faulty script at its key ceremony on 30 April 2025, which created a second set of weaker keys that were then used for the certificate requests by mistake.

## Why Go hardcoded the keys

Browsers have their own channels for pushing out blocks like this, and [Chrome and Firefox both used them](https://thehackernews.com/2026/10/eight-emudhra-ca-keys-compromised.html). Software outside the browser is much harder to reach, and [Filippo Valsorda](https://filippo.io/), who maintains Go’s cryptography standard library, explained why [on Go’s issue tracker](https://github.com/golang/go/issues/82345#issuecomment-6294844223):

> the state of Linux root stores (a pile of PEM files behind a dumpster) is such that the revocation of these intermediates has no way to propagate to applications, short of hardcoding them in code like this.

So Go did exactly that. [Go 1.27.3 and 1.26.10](https://groups.google.com/g/golang-announce/c/66pojueaQek) carry the SHA-256 hashes of the eight public keys and reject any certificate chain that contains one of them. Because [that list lives in Go’s own source code](https://github.com/golang/go/commit/7f86f957633ee31a1c17a1eb8452ca7a3d9bc141), it doesn’t rely on the system’s root store at all, although a program only gets the protection once it’s rebuilt with one of those versions.

An app that downloads an AI model can borrow the same idea: if the expected hash of the model file is written into the app, the app can check the file for itself before it ever uses it.

## Pinning a model’s hash

Hugging Face shows a SHA-256 on a GGUF file’s page. The page for [Qwen_Qwen3-0.6B-Q4_K_M.gguf](https://huggingface.co/NobodyWho/Qwen_Qwen3-0.6B-GGUF/blob/main/Qwen_Qwen3-0.6B-Q4_K_M.gguf) in NobodyWho’s repo, for example, lists `168a5fd6…9bb2`, and the same value is available from the Hugging Face API.

[NobodyWho](https://docs.nobodywho.ooo/python/downloading-models) can either download a model and cache it the first time it’s used, or load a local file exactly as given, so the safe order is easy to follow: download the file, check its SHA-256 against the value from Hugging Face, and only then load it from disk.

NobodyWho’s own download checks the file’s size against the Content-Length header when the server sends one, and checks that every file it loads starts with the GGUF header, but it doesn’t check the file’s contents.

```python
import hashlib
from nobodywho import Chat, download_model

MODEL = "huggingface:NobodyWho/Qwen_Qwen3-0.6B-GGUF/Qwen_Qwen3-0.6B-Q4_K_M.gguf"
# The SHA256 shown on the file's Hugging Face page.
EXPECTED_SHA256 = "168a5fd6091254189e2594764db1c66dd6b2984f0091f92a86f388bddd1d9bb2"

path = download_model(MODEL)  # downloads once, then returns the cached copy

sha = hashlib.sha256()
with open(path, "rb") as f:
    for block in iter(lambda: f.read(1 << 20), b""):
        sha.update(block)

if sha.hexdigest() != EXPECTED_SHA256:
    raise RuntimeError(f"Hash mismatch for {path}: got {sha.hexdigest()}")

chat = Chat(path)  # a local path is loaded as-is
```

If the hash doesn’t match, the script stops before the model is loaded. Since `download_model` hands back the cached copy on later runs, the same check also catches a cached file that has changed since it was first downloaded. Hashing a 484 MB file, the same size as the example, took under half a second on a small two-core cloud machine.

Keep the expected hash in your own code, the way Go keeps its list in the standard library. If the app looked the hash up in the same place it downloads the model from, a file that had been swapped at the source would still pass the check. `download_model` always fetches from the repo’s main branch, so if the owner replaces the file, new installs will fail the check until you pin the new hash.