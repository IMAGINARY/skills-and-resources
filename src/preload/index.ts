import { strict as assert } from "node:assert";

// TODO: Patch @pokusew/nfc-pcsc according to https://hirok.io/posts/package-json-exports#targeting-node-js-esm-cjs-and-type-script
import PCSC from "@tockawa/nfc-pcsc";

import type { PreloadApi } from "./types";

assert(!process.contextIsolated, "contextIsolation must be disabled");

function constructNfc() {
  const nfc = new PCSC();
  window.addEventListener("unload", () => destructNfc(nfc));
  return nfc;
}

function destructNfc(nfc) {
  // failing to close readers and the nfc instance will cause the renderer process to crash upon reload
  Object.values(nfc.readers).forEach((reader) => reader.close());
  nfc.close();
}

let nfc = null;
const api: PreloadApi = {
  get nfc() {
    return nfc ?? (nfc = constructNfc());
  },
};

// @ts-ignore (define in dts)
window.api = api;
