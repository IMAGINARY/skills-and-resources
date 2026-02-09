import type { DeepReadonly } from "vue";
import options from "@/options/options.yaml";

// TODO: Create types from schema or vice versa

export type MutableOptions = {
  languages: {
    primary: string;
    secondary: string;
  };
  websocketTokenReaderUrl: string;
};

export type Options = DeepReadonly<MutableOptions>;

export async function loadOptions(): Promise<MutableOptions> {
  // TODO: Load options from file(s) at runtime
  return structuredClone(options as MutableOptions);
}
