import { strict as assert } from "node:assert";
import PCSC, { Reader } from "@tockawa/nfc-pcsc";

import type { PreloadApi } from "./types";

assert(!process.contextIsolated, "contextIsolation must be disabled");

const nfcReaders = new Set<Reader>();

function constructNfc() {
  const nfc = new PCSC();
  nfc.on("reader", (reader) => {
    nfcReaders.add(reader);
    reader.once("end", (reader) => nfcReaders.delete(reader));
  });
  window.addEventListener("unload", () => destructNfc(nfc));
  return nfc;
}

function destructNfc(nfc) {
  // failing to close readers and the nfc instance will cause the renderer process to crash upon reload
  nfcReaders.values().forEach((reader) => reader.close());
  nfc.close();
}

let nfc: PCSC | null = null;
const api: PreloadApi = {
  get nfc() {
    return nfc ?? (nfc = constructNfc());
  },
  options: {
    languages: {
      primary: process.env["SR_LANG_1"] ?? "en",
      secondary: process.env["SR_LANG_2"] ?? "de",
    },
    nfc: {
      readers: {
        challenge: new RegExp(process.env["SR_NFC_READER_REGEX_1"] ?? ".* PICC .*(?<!01)$"),
        inventory: new RegExp(process.env["SR_NFC_READER_REGEX_2"] ?? ".* PICC .* 01$"),
      },
    },
  },
};

// @ts-ignore (define in dts)
window.api = api;
