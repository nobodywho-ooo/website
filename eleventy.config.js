import { DateTime } from "luxon";
import markdownIt from "markdown-it";
import svg from "./src/_includes/shortcodes/svg.js";
import lazyImagesPlugin from "eleventy-plugin-lazyimages";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";

const isPostPublished = (post) => !post.data.draft;

export default async function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("src/assets/css/style.css");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/favicon");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "/robots.txt" });
  eleventyConfig.addPassthroughCopy("src/assets/css/tailwind-dist.css");
  eleventyConfig.addPassthroughCopy("src/assets/css/prism-dark.css");
  eleventyConfig.setServerOptions({
    watch: ["./src/assets/css/tailwind-dist.css"],
  });
  eleventyConfig.addPlugin(lazyImagesPlugin);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);

  eleventyConfig.addPassthroughCopy({
    "./node_modules/alpinejs/dist/cdn.js": "./js/alpine.js",
  });

  eleventyConfig.addPassthroughCopy({
    "./node_modules/@tailwindplus/elements/dist/index.js": "./js/elements.js",
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

  eleventyConfig.addCollection("page", function (collections) {
    return collections.getFilteredByTag("page").sort(function (a, b) {
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

  return {
    dir: {
      input: "src",
      data: "_data",
      includes: "_includes",
      layouts: "_layouts",
    },
  };
};
