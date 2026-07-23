import { DateTime } from "luxon";
import fs from "node:fs";
import { execSync } from "child_process";
import markdownIt from "markdown-it";
import svg from "./src/_includes/shortcodes/svg.js";
import button from "./src/_includes/shortcodes/button.js";
import lazyImagesPlugin from "eleventy-plugin-lazyimages";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import rssPlugin from "@11ty/eleventy-plugin-rss";

const isPostPublished = (post) => !post.data.draft;

export default async function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/favicon");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");
  eleventyConfig.addPassthroughCopy("src/assets/js");
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

  eleventyConfig.addPlugin(rssPlugin);

  eleventyConfig.addPassthroughCopy({
    "./node_modules/alpinejs/dist/cdn.js": "./js/alpine.js",
  });
  eleventyConfig.addPassthroughCopy("src/assets/js/gsap.min.js");
  eleventyConfig.addPassthroughCopy("src/assets/js/bento-hover.js");


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

  // Inline an SVG logo file referenced from data (e.g. "./assets/logos/labs/google.svg").
  // Strips the XML prolog/comments and the root width/height so the wrapper controls sizing.
  eleventyConfig.addFilter("inlineLogo", (logoPath) => {
    if (!logoPath) return "";
    const filePath = logoPath.replace(/^\.\//, "src/");
    let svg = fs.readFileSync(filePath, "utf8");
    svg = svg
      .replace(/<\?xml[\s\S]*?\?>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .trim();
    return svg.replace(/<svg([^>]*)>/, (match, attrs) => {
      const cleaned = attrs
        .replace(/\s(width|height)="[^"]*"/g, "")
        .replace(/\sstyle="[^"]*"/g, "");
      return `<svg${cleaned} class="h-full w-full" aria-hidden="true" focusable="false">`;
    });
  });

  // Map a model pipeline key to a human-readable label.
  const pipelineLabels = {
    textGeneration: "Text generation",
    imageToImage: "Image to Image",
    imageTextToText: "Image/Text to Text",
    audioTextToText: "Audio/Text to Text",
    imageAudioTextToText: "Image/Audio/Text to Text",
    textToSpeech: "Text To Speech",
    featureExtraction: "Feature extraction",
    textRanking: "Text ranking",
  };
  eleventyConfig.addFilter("pipelineLabel", (key) => pipelineLabels[key] || key);

  // Flatten every model across all labs/families into a single list,
  // annotated with its lab/family context and sorted newest-first by release date.
  eleventyConfig.addFilter("allModels", (labs, families) => {
    const list = [];
    for (const lab of labs) {
      for (const familyKey of lab.families || []) {
        const family = families[familyKey];
        if (!family) continue;
        for (const model of family.models || []) {
          list.push({
            labName: lab.name,
            familyName: family.name,
            familyLogo: family.logo,
            pipeline: family.pipeline,
            languages: family.languages || [],
            variant: model.variant,
            idealDeviceDeployment: model.idealDeviceDeployment || "",
            sizeGB: model.sizeGB,
            parameterCountBillions: model.parameterCountBillions,
            releaseDate: model.releaseDate || "",
            tags: model.tags || [],
            thinking: model.thinking || false,
            recommended: model.recommended || false,
            huggingface: model.huggingface,
            downloadLinks: model.downloadLinks || [],
          });
        }
      }
    }
    return list.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  });

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

  // Format an ISO date string (e.g. "2026-05-29") as "Month year" (e.g. "May 2026").
  eleventyConfig.addFilter("monthYear", (isoDate) => {
    if (!isoDate) return "";
    return DateTime.fromISO(isoDate).toFormat("LLLL yyyy");
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
