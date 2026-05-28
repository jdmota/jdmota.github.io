//@ts-check
import { resolve } from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { sveltePreprocess } from "svelte-preprocess";
import { mdPlugin } from "./scripts/md";

const root = "./website";
const entries = {
  index: "index.html",
  utils: "utils/index.html",
  formResults: "utils/form-results/index.html",
  qrcode: "utils/qrcode/index.html",
};

export default defineConfig({
  root,
  plugins: [
    tailwindcss(),
    svelte({ preprocess: [sveltePreprocess({ typescript: true })] }),
    mdPlugin(),
  ],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        Object.entries(entries).map(([key, value]) => [
          key,
          resolve(import.meta.dirname, root, value),
        ])
      ),
    },
  },
});
