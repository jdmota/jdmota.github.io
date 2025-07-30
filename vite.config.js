//@ts-check
import fs from "fs/promises";
import { resolve } from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { sveltePreprocess } from "svelte-preprocess";
import slugify from "@sindresorhus/slugify";
import htmlnano from "htmlnano";
import markdownit from "markdown-it";
import markdownitanchor from "markdown-it-anchor";
import markdowntoc from "markdown-toc";
import markdownlinks from "markdown-it-link-attributes";

function renderMarkdown(md) {
  return markdownit({ html: true })
    .use(markdownlinks, {
      matcher(href) {
        return href.match(/^https?:\/\//) || href.startsWith("/material/");
      },
      attrs: { target: "_blank", rel: "noopener" },
    })
    .use(markdownitanchor, { slugify })
    .render(md);
}

function renderToc(md) {
  const toc = markdowntoc(md, { slugify, maxdepth: 2 });
  //@ts-ignore
  return renderMarkdown(toc.content);
}

const root = "./website";
const entries = {
  index: "index.html",
  formResults: "utils/form-results/index.html",
  qrcode: "utils/qrcode/index.html",
};

const indexMd = resolve("website/index.md").replaceAll("\\", "/");

export default defineConfig({
  root,
  plugins: [
    tailwindcss(),
    svelte({ preprocess: [sveltePreprocess({ typescript: true })] }),
    {
      name: "my-index",
      enforce: "pre",
      buildStart() {
        // this.addWatchFile(indexMd);
      },
      handleHotUpdate({ file, server }) {
        if (file === indexMd) {
          console.log("Updated", indexMd);
          server.ws.send({ type: "full-reload", path: "/index.html" });
        }
      },
      async transformIndexHtml(html, ctx) {
        if (ctx.path === "/index.html") {
          const md = await fs.readFile(indexMd, "utf8");
          const newHtml = html
            .replace("$CONTENT$", renderMarkdown(md))
            .replace("$TOC$", renderToc(md));
          const minified = await htmlnano.process(newHtml, {
            removeComments: true,
            minifyCss: false,
            minifyJs: false,
            minifySvg: false,
          });
          return minified.html;
        }
        return html;
      },
    },
  ],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        Object.entries(entries).map(([key, value]) => [
          key,
          resolve(__dirname, root, value),
        ])
      ),
    },
  },
});
