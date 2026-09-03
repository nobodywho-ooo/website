// /.well-known/ard.json — Agentic Resource Discovery catalog.
// Lets AI clients discover NobodyWho's agentic resources (data API, OpenAPI
// spec, llms.txt, in-page WebMCP tools). Spec: https://agenticresourcediscovery.org/
export default class {
  data() {
    return {
      permalink: "/.well-known/ard.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const base = data.site.url;
    return JSON.stringify(
      {
        entries: [
          {
            identifier: "urn:air:nobodywho.ai:api:openapi",
            displayName: "NobodyWho Data API (OpenAPI)",
            type: "application/vnd.oai.openapi+json",
            url: `${base}/openapi.json`,
            description:
              "OpenAPI 3.1 description of NobodyWho's public, read-only data API: recommended on-device models, supported SDK platforms and blog posts. No authentication.",
            capabilities: ["listModels", "listPlatforms", "listPosts"],
            representativeQueries: [
              "which on-device AI models does NobodyWho recommend",
              "how do I install NobodyWho for my platform",
              "list NobodyWho blog posts",
            ],
          },
          {
            identifier: "urn:air:nobodywho.ai:api:index",
            displayName: "NobodyWho Data API index",
            type: "application/json",
            url: `${base}/api/index.json`,
            description:
              "Discovery document listing every reachable JSON endpoint of the NobodyWho data API.",
            representativeQueries: [
              "what API endpoints does NobodyWho expose",
              "where is the NobodyWho model catalog JSON",
            ],
          },
          {
            identifier: "urn:air:nobodywho.ai:doc:llms",
            displayName: "NobodyWho llms.txt",
            type: "text/plain",
            url: `${base}/llms.txt`,
            description:
              "LLM-friendly map of the site with when-to-use guidance and links to agent resources.",
            representativeQueries: [
              "what is NobodyWho and when should I use it",
              "how to run an LLM locally on device",
            ],
          },
          {
            identifier: "urn:air:nobodywho.ai:skills:index",
            displayName: "NobodyWho agent capabilities",
            type: "application/json",
            url: `${base}/.well-known/agent-skills/index.json`,
            description:
              "In-page WebMCP tools NobodyWho exposes to browser-resident agents: search the model catalog, get install commands, list platforms and blog posts.",
            capabilities: [
              "search_models",
              "get_install_command",
              "list_platforms",
              "list_blog_posts",
            ],
            representativeQueries: [
              "search the NobodyWho model catalog",
              "get the NobodyWho install command for flutter",
            ],
          },
        ],
      },
      null,
      2,
    );
  }
}
