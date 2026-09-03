// GET /api/platforms.json — the platforms/SDKs NobodyWho ships, with install
// commands, docs and starter repos. Generated from _data/platforms.json.
export default class {
  data() {
    return {
      permalink: "/api/platforms.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    return JSON.stringify(
      {
        object: "list",
        endpoint: `${data.site.url}/api/platforms.json`,
        description:
          "Languages and frameworks the NobodyWho on-device inference SDK supports.",
        count: data.platforms.length,
        data: data.platforms,
      },
      null,
      2,
    );
  }
}
