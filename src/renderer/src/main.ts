import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import ui from "@nuxt/ui/vue-plugin";
import Vue3TouchEvents from "vue3-touch-events";
import App from "./App.vue";

import { OPTIONS_INJECTION_KEY, CONFIG_INJECTION_KEY } from "@renderer/constants";
import { loadOptions } from "@renderer/options/options";
import { loadConfig } from "@renderer/config/config";

import type { Vue3TouchEventsOptions } from "vue3-touch-events";

const app = createApp(App);
app.provide(OPTIONS_INJECTION_KEY, await loadOptions());
app.provide(CONFIG_INJECTION_KEY, await loadConfig());
app.use(createPinia());
app.use(ui, { router: () => {} });
app.use<Vue3TouchEventsOptions>(Vue3TouchEvents, {});
app.mount("#app");
