import { fileURLToPath, URL } from "url";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import importToCDN from "vite-plugin-cdn-import";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    importToCDN({
      modules: [
        {
          name: "highlight.js",
          var: "HighlightJS",
          path: "/lib/index.min.js",
        },
      ],
    }),
    vue(),
    viteCommonjs(),
  ],
  base: "",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
