import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { GesturePlugin } from "@vueuse/gesture";
import App from "./App.vue";

import { OPTIONS_INJECTION_KEY, CONFIG_INJECTION_KEY } from "@/constants";
import { loadOptions } from "@/options/options";
import { loadConfig } from "@/config/config";

const options = await loadOptions();
const config = await loadConfig(options);

const app = createApp(App);
app.provide(OPTIONS_INJECTION_KEY, options);
app.provide(CONFIG_INJECTION_KEY, config);
app.use(createPinia());
app.use(GesturePlugin);
app.mount("#app");
