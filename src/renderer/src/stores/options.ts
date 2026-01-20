import { defineStore } from "pinia";

import type { Options } from "@renderer/options/options";

export const useOptionsStore = defineStore("options", () => {
  // Dummy state that is overwritten by a pinia plugin in main.ts
  // Is there a more elegant way to do this and still preserve type safety?
  const options = undefined as unknown as Options;
  return { options };
});
