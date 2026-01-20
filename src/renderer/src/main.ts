import "./assets/main.css";
import nfcOptions from "@renderer/options/nfc.yaml";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

import type { Options, MutableNfcOptions } from "@renderer/options/options";

// TODO: validate options and remove cast
const options: Options = { nfc: nfcOptions as MutableNfcOptions };
const app = createApp(App);

console.log(options);

const pinia = createPinia();
pinia.use(({ store }) => {
  // Augment only the "options" store with the "options" object.
  return store.$id === "options" ? { options } : {};
});

app.use(pinia);

app.mount("#app");
