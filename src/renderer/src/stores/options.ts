import type { Options } from "@renderer/options/options";

import { inject } from "vue";
import { defineStore } from "pinia";
import { strict as assert } from "assert";

import { OPTIONS_INJECTION_KEY } from "@renderer/constants";

export const useOptionsStore = defineStore("options", () => {
  const nullableOptions = inject<Options | null>(OPTIONS_INJECTION_KEY, null);
  assert(nullableOptions !== null);
  const options = nullableOptions!;
  return { options };
});
