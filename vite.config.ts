import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import svgLoader from "vite-svg-loader";

const gitCommitHash =
  process.env.GIT_COMMIT_HASH || execSync("git rev-parse HEAD").toString().trim();

export default defineConfig({
  base: "./",
  define: {
    "process.env.GIT_COMMIT_HASH": JSON.stringify(gitCommitHash),
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [vue(), vueDevTools(), svgLoader(), nodePolyfills({ include: ["events", "assert"] })],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes("node_modules") ? "vendor" : null),
      },
    },
  },
});
