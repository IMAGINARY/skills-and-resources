import type { Config, I18nRecord } from "@renderer/config/config";

import { computed, inject } from "vue";
import { defineStore } from "pinia";
import { strict as assert } from "assert";

import { CONFIG_INJECTION_KEY } from "@renderer/constants";
import { useOptionsStore } from "./options";

const t = (i18nRecord: I18nRecord, languageCode: string) => {
  if (typeof i18nRecord === "string") return i18nRecord;
  if (typeof i18nRecord[languageCode] === "string") return i18nRecord[languageCode];
  return "<undefined>";
};

export const useConfigStore = defineStore("config", () => {
  const config = inject<Config | null>(CONFIG_INJECTION_KEY, null);
  assert(config);

  const { options } = useOptionsStore();

  const { primary: lang1st, secondary: lang2nd } = options.languages;
  const t1st = (i18nRecord: I18nRecord) => computed(() => t(i18nRecord, lang1st));
  const t2nd = (i18nRecord: I18nRecord) => computed(() => t(i18nRecord, lang2nd));

  return { config, t1st, t2nd };
});
