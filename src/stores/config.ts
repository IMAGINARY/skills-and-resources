import type { Config, I18nRecord, Item, Challenge, CharacterType } from "@/config/config";
import type { DeepReadonly } from "vue";

import { computed, inject } from "vue";
import { defineStore } from "pinia";
import { strict as assert } from "assert";

import { CONFIG_INJECTION_KEY } from "@/constants";
import { useOptionsStore } from "./options";

const t = (i18nRecord: I18nRecord, languageCode: string) => {
  if (typeof i18nRecord === "string") return i18nRecord;
  if (typeof i18nRecord[languageCode] === "string") return i18nRecord[languageCode];
  return "<undefined>";
};

export const useConfigStore = defineStore("config", () => {
  const nullableConfig = inject<Config | null>(CONFIG_INJECTION_KEY, null);
  assert(nullableConfig !== null);
  const config = nullableConfig!;

  const asMap = <T extends { id: string }>(a: readonly T[]): Record<string, T> => {
    const m = {};
    for (const v of a) {
      assert(!a[v.id], `Id must be unique, but ${v.id} appears multiple times.`);
      m[v.id] = v;
    }
    return m;
  };

  const items: DeepReadonly<Record<string, Item>> = asMap(config.items);
  const characterTypes: DeepReadonly<Record<string, CharacterType>> = asMap(config.characterTypes);
  const challenges: DeepReadonly<Record<string, Challenge>> = asMap(config.challenges);

  const { options } = useOptionsStore();

  const { primary: lang1st, secondary: lang2nd } = options.languages;
  const t1st = (i18nRecord: I18nRecord) => computed(() => t(i18nRecord, lang1st));
  const t2nd = (i18nRecord: I18nRecord) => computed(() => t(i18nRecord, lang2nd));

  return { config, items, characterTypes, challenges, t1st, t2nd };
});
