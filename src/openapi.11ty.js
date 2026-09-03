// GET /openapi.json — OpenAPI 3.1 specification for the public NobodyWho data
// API. Describes the real, static, read-only endpoints served under /api/.
export default class {
  data() {
    return {
      permalink: "/openapi.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const base = data.site.url;

    const listResponse = (itemsRef) => ({
      "200": {
        description: "OK",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                object: { type: "string", example: "list" },
                endpoint: { type: "string", format: "uri" },
                description: { type: "string" },
                count: { type: "integer" },
                data: { type: "array", items: { $ref: itemsRef } },
              },
            },
          },
        },
      },
    });

    const spec = {
      openapi: "3.1.0",
      info: {
        title: `${data.site.name} Data API`,
        version: "1.0.0",
        description:
          "Public, read-only JSON API for NobodyWho — the on-device inference engine that runs LLMs locally with no server or API key. These endpoints expose a curated selection of recommended models, the supported SDK platforms and the blog. NobodyWho is not limited to the listed models: it can run ANY compatible model — text-generation / chat models in GGUF format, and speech-to-text, text-to-speech and voice-activity-detection models in ONNX format — loaded from Hugging Face or any URL. NobodyWho itself runs fully on-device; there is no hosted inference endpoint.",
        contact: { name: "NobodyWho", url: base },
        license: { name: "EUPL-1.2" },
      },
      servers: [{ url: base }],
      paths: {
        "/api/models.json": {
          get: {
            operationId: "listModels",
            summary: "List recommended on-device models",
            description:
              "Returns a curated SELECTION of models NobodyWho recommends for on-device inference. This is not exhaustive: NobodyWho can run any compatible model — text generation in GGUF, and speech-to-text, text-to-speech and voice activity detection in ONNX.",
            responses: listResponse("#/components/schemas/Model"),
          },
        },
        "/api/platforms.json": {
          get: {
            operationId: "listPlatforms",
            summary: "List supported SDK platforms",
            description:
              "Returns the languages and frameworks the NobodyWho SDK supports, with install commands, docs and starter repos.",
            responses: listResponse("#/components/schemas/Platform"),
          },
        },
        "/api/posts.json": {
          get: {
            operationId: "listPosts",
            summary: "List blog posts",
            description: "Returns NobodyWho blog posts, tutorials and technical write-ups.",
            responses: listResponse("#/components/schemas/Post"),
          },
        },
      },
      components: {
        schemas: {
          Model: {
            type: "object",
            properties: {
              lab: { type: "string" },
              family: { type: "string" },
              variant: { type: "string" },
              pipeline: { type: "string" },
              pipelineLabel: { type: "string" },
              parameterCountBillions: { type: "number" },
              sizeGB: { type: "string" },
              idealDeviceDeployment: { type: "string" },
              releaseDate: { type: "string", format: "date" },
              languages: { type: "array", items: { type: "string" } },
              thinking: { type: "boolean" },
              recommended: { type: "boolean" },
              tags: { type: "array", items: { type: "string" } },
              huggingfaceUrl: { type: ["string", "null"], format: "uri" },
              downloadLinks: { type: "array", items: { type: "object" } },
            },
          },
          Platform: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              language: { type: "string" },
              packageManager: { type: "string" },
              package: { type: "string" },
              install: { type: ["string", "null"] },
              docsUrl: { type: "string", format: "uri" },
              starterUrl: { type: ["string", "null"], format: "uri" },
            },
          },
          Post: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: ["string", "null"] },
              url: { type: "string", format: "uri" },
              date: { type: "string", format: "date" },
              categories: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    };

    return JSON.stringify(spec, null, 2);
  }
}
