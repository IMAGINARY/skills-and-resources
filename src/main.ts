import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { GesturePlugin } from "@vueuse/gesture";
import App from "./App.vue";
import { initSentry, addSentryVue } from "@/sentry";

import { OPTIONS_INJECTION_KEY, CONFIG_INJECTION_KEY } from "@/constants";
import { loadOptions } from "@/options/options";
import { loadConfig } from "@/config/config";

const options = await loadOptions();
const { sentryDsn } = options;
const useSentry = !!sentryDsn;

if (useSentry) initSentry(sentryDsn);

const config = await loadConfig(options);
const app = createApp(App);
const pinia = createPinia();

if (useSentry) addSentryVue(app, pinia);

app.provide(OPTIONS_INJECTION_KEY, options);
app.provide(CONFIG_INJECTION_KEY, config);

app.use(pinia);
app.use(GesturePlugin);
app.mount("#app");
