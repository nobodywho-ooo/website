/*
 * WebMCP tool registration for NobodyWho.
 *
 * Exposes in-page tools to browser-resident AI agents via the W3C WebMCP draft.
 * Prefers document.modelContext.registerTool() (Chrome 150+ / current draft) and
 * falls back to navigator.modelContext (the deprecated pre-Chrome-150 alias).
 * Tools are backed by the same public JSON API served under /api/, so they stay
 * in sync with the rest of the site and degrade gracefully when WebMCP is absent.
 */
(function () {
  "use strict";

  var ctx =
    (typeof document !== "undefined" && document.modelContext) ||
    (typeof navigator !== "undefined" && navigator.modelContext) ||
    null;

  if (!ctx || typeof ctx.registerTool !== "function") return;

  function text(payload) {
    var body = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    return { content: [{ type: "text", text: body }] };
  }

  async function getJson(path) {
    var res = await fetch(path, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Request failed: " + res.status);
    return res.json();
  }

  function register(tool) {
    try {
      ctx.registerTool(tool);
    } catch (err) {
      /* Ignore duplicate/unsupported registrations. */
    }
  }

  register({
    name: "list_platforms",
    description:
      "List the platforms and languages the NobodyWho on-device inference SDK supports (Python, React Native, Expo, Flutter, Swift, Kotlin/Android, Godot), with install commands, docs and starter repos.",
    inputSchema: { type: "object", properties: {} },
    async execute() {
      var data = await getJson("/api/platforms.json");
      return text(data.data);
    },
  });

  register({
    name: "get_install_command",
    description:
      "Get the exact install command for adding NobodyWho to a given platform. Pass a platform id such as python, react-native, expo, flutter, swift, kotlin or godot.",
    inputSchema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          description: "Platform id, e.g. 'python', 'flutter', 'react-native'.",
        },
      },
      required: ["platform"],
    },
    async execute(args) {
      var wanted = String((args && args.platform) || "").toLowerCase().trim();
      var data = await getJson("/api/platforms.json");
      var match = data.data.find(function (p) {
        return p.id === wanted || p.name.toLowerCase() === wanted;
      });
      if (!match) {
        return text(
          "Unknown platform '" +
            wanted +
            "'. Available: " +
            data.data.map(function (p) { return p.id; }).join(", "),
        );
      }
      return text({
        platform: match.name,
        install: match.install || "See docs — installed via " + match.packageManager,
        package: match.package,
        docs: match.docsUrl,
        starter: match.starterUrl,
      });
    },
  });

  register({
    name: "search_models",
    description:
      "Search NobodyWho's curated selection of RECOMMENDED on-device models. These are recommendations, not a limit: NobodyWho can run any compatible model (text generation in GGUF; speech-to-text, text-to-speech and voice activity detection in ONNX) from Hugging Face or any URL. Optionally filter by a free-text query matched against model family, lab, variant, capability (pipeline) or ideal device (e.g. 'smartphone', 'gemma', 'speech to text').",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Optional free-text filter. Omit to list the full catalog.",
        },
      },
    },
    async execute(args) {
      var q = String((args && args.query) || "").toLowerCase().trim();
      var data = await getJson("/api/models.json");
      var models = data.data;
      if (q) {
        models = models.filter(function (m) {
          return [m.lab, m.family, m.variant, m.pipeline, m.pipelineLabel, m.idealDeviceDeployment]
            .join(" ")
            .toLowerCase()
            .includes(q);
        });
      }
      return text({ count: models.length, models: models });
    },
  });

  register({
    name: "list_blog_posts",
    description:
      "List NobodyWho blog posts, tutorials and technical write-ups about running LLMs on-device.",
    inputSchema: { type: "object", properties: {} },
    async execute() {
      var data = await getJson("/api/posts.json");
      return text(data.data);
    },
  });
})();
