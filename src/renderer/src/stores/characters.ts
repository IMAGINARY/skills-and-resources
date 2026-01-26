import type { Config } from "@renderer/config/config";

import { inject, ref } from "vue";
import { defineStore } from "pinia";
import { strict as assert } from "assert";

import { CONFIG_INJECTION_KEY } from "@renderer/constants";

export type Character = {
  readonly id: string;
  class: string;
  dynamicItems: string[];
};

export const useCharacterStore = defineStore("characters", () => {
  const config = inject<Config | null>(CONFIG_INJECTION_KEY, null);
  assert(config);

  const characters = ref(new Array<Character>());
  const updateClass = (characterId: string, characterClass: string) => {
    const character = characters.value.find((i) => i.id === characterId) ?? false;
    if (!character) {
      const newCharacter: Character = { id: characterId, class: characterClass, dynamicItems: [] };
      characters.value.push(newCharacter);
      return;
    }

    character.class = characterClass;
  };

  const updateDynamicItems = (characterId: string, dynamicItemIds: string[]) => {
    const character = characters.value.find((i) => i.id === characterId);
    assert(character); // TODO: Handle this error more gracefully
    // TODO: either remove static items from dynamic items or report an error if they are present in both lists
    character.dynamicItems = [...dynamicItemIds];
  };

  return { characters, updateClass, updateDynamicItems };
});
