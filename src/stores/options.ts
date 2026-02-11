import type { DeepReadonly } from "vue";
import type { Options } from "@/options/options";

import { inject } from "vue";
import { defineStore } from "pinia";
import { strict as assert } from "assert";

import { OPTIONS_INJECTION_KEY } from "@/constants";

export const useOptionsStore = defineStore("options", () => {
  const nullableOptions = inject<DeepReadonly<Options> | null>(OPTIONS_INJECTION_KEY, null);
  assert(nullableOptions !== null);
  const options = nullableOptions!;
  return { options };
});
