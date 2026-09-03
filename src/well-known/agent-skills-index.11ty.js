// /.well-known/agent-skills/index.json — index of the agent-callable
// capabilities this site exposes. These are the in-page WebMCP tools registered
// via document.modelContext; each is backed by a reachable JSON endpoint an
// agent can also fetch directly. Path convention: agentskills.io discovery.
export default class {
  data() {
    return {
      permalink: "/.well-known/agent-skills/index.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const base = data.site.url;
    return JSON.stringify(
      {
        $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
        name: "nobodywho-agent-skills",
        description:
          "Agent-callable capabilities exposed by nobodywho.ai, available as in-page WebMCP tools (document.modelContext) and as reachable JSON endpoints.",
        invocation: "webmcp",
        implementation: `${base}/assets/js/webmcp.js`,
        skills: [
          {
            name: "search_models",
            type: "webmcp-tool",
            description:
              "Search NobodyWho's curated selection of recommended on-device models by name, lab, capability or target device. NobodyWho can run any compatible model (GGUF for text generation; ONNX for speech-to-text, text-to-speech and voice activity detection).",
            url: `${base}/api/models.json`,
          },
          {
            name: "get_install_command",
            type: "webmcp-tool",
            description:
              "Get the exact install command for adding the NobodyWho on-device inference SDK to a platform (python, react-native, expo, flutter, swift, kotlin, godot).",
            url: `${base}/api/platforms.json`,
          },
          {
            name: "list_platforms",
            type: "webmcp-tool",
            description:
              "List the platforms and languages the NobodyWho SDK supports, with install commands, docs and starter repos.",
            url: `${base}/api/platforms.json`,
          },
          {
            name: "list_blog_posts",
            type: "webmcp-tool",
            description:
              "List NobodyWho blog posts, tutorials and technical write-ups about running LLMs on-device.",
            url: `${base}/api/posts.json`,
          },
        ],
      },
      null,
      2,
    );
  }
}
