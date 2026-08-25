import { DateTime } from "luxon";
import fs from "node:fs";
import { execSync } from "child_process";
import markdownIt from "markdown-it";
import svg from "./src/_includes/shortcodes/svg.js";
import button from "./src/_includes/shortcodes/button.js";
import lazyImagesPlugin from "eleventy-plugin-lazyimages";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import rssPlugin from "@11ty/eleventy-plugin-rss";
import blogCategories from "./src/_data/blogCategories.js";

const isListedInBlog = (post) => !post.data.draft && !post.data.hideInBlog;

// Number of posts per page in the blog index and in each category listing - Keep this in sync with the `pagination.size` in src/posts.njk.
const POSTS_PER_PAGE = 10;

// Turn a category name into a URL-safe slug, e.g. "React Native" -> "react-native".
const slugify = (value) =>
  String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

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
    speechToText: "Speech To Text",
    voiceActivityDetection: "Voice Activity Detection",
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
    return collections.getFilteredByTag("page")
      // Only keep the first page of any paginated menu item (e.g. the blog), otherwise /posts/page-2/ etc. would each add a duplicate nav entry.
      .filter((item) => !item.data.pagination || item.data.pagination.pageNumber === 0)
      .sort(function(a, b) {
        return a.data.order - b.data.order;
      });
  });

  eleventyConfig.addCollection("posts", (collection) => {
    return collection.getFilteredByGlob("./src/posts/*.md").filter(isListedInBlog);
  });

  // Expose the slug helper to templates (used for category pill links in blog).
  eleventyConfig.addFilter("blogSlug", slugify);

  // Build one entry per (category, page) so each category gets its own paginated listing
  eleventyConfig.addCollection("categoryPages", (collection) => {
    const posts = collection
      .getFilteredByGlob("./src/posts/*.md")
      .filter(isListedInBlog)
      .sort((a, b) => b.date - a.date);

    const pages = [];
    for (const category of blogCategories) {
      const slug = slugify(category);
      const base = `/posts/category/${slug}/`;
      const hrefFor = (pageIndex) => (pageIndex === 0 ? base : `${base}page-${pageIndex + 1}/`);
      const catPosts = posts.filter((post) => (post.data.categories || []).includes(category));
      const totalPages = Math.max(1, Math.ceil(catPosts.length / POSTS_PER_PAGE));
      const pageHrefs = Array.from({ length: totalPages }, (_, i) => hrefFor(i));
      for (let i = 0; i < totalPages; i++) {
        pages.push({
          category,
          slug,
          posts: catPosts.slice(i * POSTS_PER_PAGE, (i + 1) * POSTS_PER_PAGE),
          pageNumber: i,
          totalPages,
          pageHref: hrefFor(i),
          pageHrefs,
          prevHref: i > 0 ? hrefFor(i - 1) : null,
          nextHref: i < totalPages - 1 ? hrefFor(i + 1) : null,
        });
      }
    }
    return pages;
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

  // SEO / Structured data (JSON-LD) in _head.njk : Collect only the https(s) profile URLs from footer links, for schema.org sameAs.
  eleventyConfig.addFilter("socialUrls", (footer) =>
    (footer || []).map((l) => l.url).filter((u) => u && u.startsWith("https://"))
  );

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
