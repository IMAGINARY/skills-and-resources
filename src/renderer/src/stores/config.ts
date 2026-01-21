import type { Config } from "@renderer/config/config";

import { inject } from "vue";
import { defineStore } from "pinia";
import { strict as assert } from "assert";

import { CONFIG_INJECTION_KEY } from "@renderer/constants";

export const useConfigStore = defineStore("config", () => {
  const config = inject<Config | null>(CONFIG_INJECTION_KEY, null);
  assert(config);

  return { config };
});
