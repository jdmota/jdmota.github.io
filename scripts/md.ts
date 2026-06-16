import fs from "fs/promises";
import { resolve } from "path";
import { createLogger } from "vite";
import slugify from "@sindresorhus/slugify";
import htmlnano from "htmlnano";
import markdownit from "markdown-it";
import markdownitanchor from "markdown-it-anchor";
import markdowntoc from "markdown-toc";
import markdownlinks from "markdown-it-link-attributes";

function renderMarkdown(md: string) {
  return markdownit({ html: true })
    .use(markdownlinks, {
      matcher(href: string) {
        return href.match(/^https?:\/\//) || href.startsWith("/material/");
      },
      attrs: { target: "_blank", rel: "noopener noreferrer" },
    })
    .use(markdownitanchor, { slugify })
    .render(md);
}

function renderToc(md: string) {
  const toc = markdowntoc(md, { slugify, maxdepth: 2 });
  //@ts-ignore
  return renderMarkdown(toc.content);
}

const indexMd = resolve("website/index.md").replaceAll("\\", "/");

export function mdPlugin(): import("vite").Plugin {
  let logger: import("vite").Logger;

  return {
    name: "my-index",
    enforce: "pre",
    async configResolved(config) {
      logger = createLogger(undefined, { prefix: "[md-plugin]" });
    },
    buildStart() {
      // this.addWatchFile(indexMd);
    },
    async hotUpdate({ type, file }) {
      if (file === indexMd) {
        logger.info(`${type}d ${file}`, { timestamp: true });
        this.environment.hot.send({ type: "full-reload" });
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
  };
}
