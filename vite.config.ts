import { resolve } from "path";
import { defineConfig } from "vite";
import viteYaml from "@modyfi/vite-plugin-yaml";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import ui from "@nuxt/ui/vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [
    viteYaml(),
    vue(),
    vueDevTools(),
    ui({ router: false }),
    nodePolyfills({ include: ["events", "assert"] }),
  ],
});
