import { resolve } from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { sveltePreprocess } from "svelte-preprocess";

const root = "./website";
const entries = {
  index: "index.html",
  formResults: "utils/form-results/index.html",
  qrcode: "utils/qrcode/index.html",
};

export default defineConfig({
  root,
  plugins: [
    svelte({
      preprocess: [sveltePreprocess({ typescript: true })],
    }),
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
