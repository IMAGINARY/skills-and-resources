import type { DeepReadonly } from "vue";

export type MutableOptions = typeof window.api.options;

export type Options = DeepReadonly<MutableOptions>;

export async function loadOptions(): Promise<MutableOptions> {
  return structuredClone(window.api.options);
}
