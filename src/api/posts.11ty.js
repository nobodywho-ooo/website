// GET /api/posts.json — the blog index as machine-readable JSON so agents can
// discover NobodyWho's articles, tutorials and technical write-ups.
export default class {
  data() {
    return {
      permalink: "/api/posts.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const posts = [...data.collections.allPosts]
      .sort((a, b) => b.date - a.date)
      .map((post) => ({
        title: post.data.title,
        description: post.data.description || null,
        url: `${data.site.url}${post.url}`,
        date: post.date.toISOString().slice(0, 10),
        categories: post.data.categories || [],
      }));

    return JSON.stringify(
      {
        object: "list",
        endpoint: `${data.site.url}/api/posts.json`,
        description: "NobodyWho blog posts: news, tutorials and technical write-ups.",
        count: posts.length,
        data: posts,
      },
      null,
      2,
    );
  }
}
