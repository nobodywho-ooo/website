// GET /api/index.json — discovery document for the public NobodyWho data API.
// Lists every reachable endpoint and points to the OpenAPI specification.
export default class {
  data() {
    return {
      permalink: "/api/index.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const base = data.site.url;
    return JSON.stringify(
      {
        name: `${data.site.name} Data API`,
        description:
          "Public, read-only JSON API describing a curated selection of models NobodyWho recommends, its supported platforms and blog. No authentication required. NobodyWho can run any compatible model (GGUF for text generation; ONNX for speech-to-text, text-to-speech and voice activity detection), not only the listed ones.",
        version: "1.0.0",
        documentation: `${base}/developers/`,
        openapi: `${base}/openapi.json`,
        endpoints: [
          {
            method: "GET",
            path: "/api/models.json",
            url: `${base}/api/models.json`,
            description: "Recommended on-device model selection (NobodyWho runs any GGUF/ONNX model).",
          },
          {
            method: "GET",
            path: "/api/platforms.json",
            url: `${base}/api/platforms.json`,
            description: "Supported SDK platforms with install commands.",
          },
          {
            method: "GET",
            path: "/api/posts.json",
            url: `${base}/api/posts.json`,
            description: "Blog posts, tutorials and technical write-ups.",
          },
        ],
      },
      null,
      2,
    );
  }
}
