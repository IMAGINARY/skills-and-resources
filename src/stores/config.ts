import {
  type ChallengeConfig,
  type CharacterTypeConfig,
  type Config,
  type ItemConfig,
} from "@/types/config";
import type { DeepReadonly } from "vue";
import { inject } from "vue";
import { defineStore } from "pinia";
import { strict as assert } from "assert";

import { CONFIG_INJECTION_KEY } from "@/constants";

export const useConfigStore = defineStore("config", () => {
  const nullableConfig = inject<DeepReadonly<Config> | null>(CONFIG_INJECTION_KEY, null);
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

  const { app, content } = config;
  const items: DeepReadonly<Record<string, ItemConfig>> = asMap(content.items);
  const characterTypes: DeepReadonly<Record<string, CharacterTypeConfig>> = asMap(
    content.characterTypes,
  );
  const challenges: DeepReadonly<Record<string, ChallengeConfig>> = asMap(content.challenges);

  return {
    app,
    content,
    items,
    characterTypes,
    challenges,
  };
});
