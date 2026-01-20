import type { DeepReadonly } from "vue";

export type MutableNfcOptions = { readerNames: { challenge: string; inventory: string } };

export type MutableOptions = {
  nfc: MutableNfcOptions;
};

export type Options = DeepReadonly<MutableOptions>;
