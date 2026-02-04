import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import ui from "@nuxt/ui/vue-plugin";
import { GesturePlugin } from "@vueuse/gesture";
import App from "./App.vue";

import { OPTIONS_INJECTION_KEY, CONFIG_INJECTION_KEY } from "@renderer/constants";
import { loadOptions } from "@renderer/options/options";
import { loadConfig } from "@renderer/config/config";

const app = createApp(App);
app.provide(OPTIONS_INJECTION_KEY, await loadOptions());
app.provide(CONFIG_INJECTION_KEY, await loadConfig());
app.use(createPinia());
app.use(ui, { router: () => {} });
app.use(GesturePlugin);
app.mount("#app");
