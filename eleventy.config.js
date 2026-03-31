import { DateTime } from "luxon";
import fs from "fs";
import markdownIt from "markdown-it";
import badge from "./src/_includes/shortcodes/badge.js";
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

  let getSvgContent = function (file) {
    let relativeFilePath = `./src/assets/svg/${file}.svg`;
    let data = fs.readFileSync(relativeFilePath, function (err, contents) {
      if (err) return err;
      return contents;
    });

    return data.toString("utf8");
  };

  eleventyConfig.addShortcode("svg", getSvgContent);
  eleventyConfig.addShortcode("badge", badge);

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
