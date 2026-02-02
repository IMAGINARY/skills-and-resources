import { resolve } from "path";
import { defineConfig } from "electron-vite";
import viteYaml from "@modyfi/vite-plugin-yaml";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import ui from "@nuxt/ui/vite";

export default defineConfig({
  main: {},
  preload: {
    build: {
      rollupOptions: {
        output: {
          format: "cjs",
        },
      },
      externalizeDeps: {
        exclude: ["@tockawa/nfc-pcsc"],
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
      },
    },
    plugins: [
      viteYaml(),
      vue(),
      vueDevTools(),
      ui({ router: false }),
      nodePolyfills({ include: ["events", "assert"] }),
    ],
  },
});
