import { DateTime } from "luxon";
import { execSync } from "child_process";
import markdownIt from "markdown-it";
import svg from "./src/_includes/shortcodes/svg.js";
import button from "./src/_includes/shortcodes/button.js";
import lazyImagesPlugin from "eleventy-plugin-lazyimages";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";

const isPostPublished = (post) => !post.data.draft;

export default async function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/favicon");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");
  eleventyConfig.addPassthroughCopy({ ".well-known": "/.well-known" });
  eleventyConfig.addPassthroughCopy("_headers");
  eleventyConfig.addPassthroughCopy("src/assets/css/tailwind-dist.css");

  // Reload the website if changes are made to tailwind.css
  eleventyConfig.addWatchTarget("./src/assets/css/tailwind.css");
  eleventyConfig.on("eleventy.before", () => {
    execSync("npx @tailwindcss/cli -i src/assets/css/tailwind.css -o src/assets/css/tailwind-dist.css");
  });

  eleventyConfig.setServerOptions({
    watch: ["./src/assets/css/tailwind-dist.css"],
  });
  eleventyConfig.addPlugin(lazyImagesPlugin);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);

  eleventyConfig.addPassthroughCopy({
    "./node_modules/alpinejs/dist/cdn.js": "./js/alpine.js",
  });


  const md = new markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  });

  eleventyConfig.addPairedShortcode("markdown", (content) => {
    return md.render(content);
  });

  eleventyConfig.addShortcode("svg", svg);
  eleventyConfig.addShortcode("button", button);

  eleventyConfig.addCollection("page", function(collections) {
    return collections.getFilteredByTag("page").sort(function(a, b) {
      return a.data.order - b.data.order;
    });
  });

  eleventyConfig.addCollection("posts", (collection) => {
    return collection.getFilteredByGlob("./src/posts/*.md").filter(isPostPublished);
  });

  eleventyConfig.addShortcode("currentDate", (date = DateTime.now()) => {
    return date;
  });

  eleventyConfig.addFilter("dateFormating", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  eleventyConfig.addFilter("dateISO", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toISODate();
  });

  return {
    dir: {
      input: "src",
      data: "_data",
      includes: "_includes",
      layouts: "_layouts",
    },
  };
};
