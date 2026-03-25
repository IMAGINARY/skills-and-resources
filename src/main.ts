import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { GesturePlugin } from "@vueuse/gesture";
import App from "./App.vue";
import { initSentry, addSentryVue } from "@/sentry";
import { setWasmUrl } from "@lottiefiles/dotlottie-vue";

import { OPTIONS_INJECTION_KEY, CONFIG_INJECTION_KEY } from "@/constants";
import { loadOptions } from "@/options/options";
import { loadConfig } from "@/config/config";

import dotlottieWasmHref from "@lottiefiles/dotlottie-web/dotlottie-player.wasm?url";

const options = await loadOptions();
const { sentryDsn } = options;
const useSentry = !!sentryDsn;

if (useSentry) initSentry(sentryDsn);

// Set local WASM URL before initializing the app to support offline development
setWasmUrl(dotlottieWasmHref);

const config = await loadConfig(options);
const app = createApp(App);
const pinia = createPinia();

if (useSentry) addSentryVue(app, pinia);

app.provide(OPTIONS_INJECTION_KEY, options);
app.provide(CONFIG_INJECTION_KEY, config);

app.use(pinia);
app.use(GesturePlugin);
app.mount("#app");
