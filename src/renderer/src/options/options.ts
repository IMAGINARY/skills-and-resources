import type { DeepReadonly } from "vue";
import options from "@renderer/options/options.yaml";

export type MutableOptions = {
  nfc: {
    readerNames: {
      challenge: string;
      inventory: string;
    };
  };
};

export type Options = DeepReadonly<MutableOptions>;

export async function loadOptions(): Promise<MutableOptions> {
  // TODO: Load options from CLI and/or URL parameters
  return structuredClone(options as MutableOptions);
}
