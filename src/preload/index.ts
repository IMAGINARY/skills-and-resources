import { strict as assert } from "node:assert";

// TODO: Patch @pokusew/nfc-pcsc according to https://hirok.io/posts/package-json-exports#targeting-node-js-esm-cjs-and-type-script
import PCSC from "@tockawa/nfc-pcsc";

import type { PreloadApi } from "./types";

assert(!process.contextIsolated, "contextIsolation must be disabled");

let nfc = null;
const api: PreloadApi = {
  get nfc() {
    return nfc ?? (nfc = new PCSC());
  },
};

// @ts-ignore (define in dts)
window.api = api;
