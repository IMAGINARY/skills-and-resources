import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { useNFC } from "./nfc/nfc";

const app = createApp(App);

app.use(createPinia());

app.mount("#app");

useNFC();
