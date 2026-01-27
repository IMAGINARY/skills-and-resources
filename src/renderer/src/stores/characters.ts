import type { Config } from "@renderer/config/config";

import { inject, ref } from "vue";
import { defineStore } from "pinia";
import { strict as assert } from "assert";

import { CONFIG_INJECTION_KEY } from "@renderer/constants";

export type Character = {
  readonly id: string;
  type: string;
  dynamicItems: string[];
};

export const useCharacterStore = defineStore("characters", () => {
  const config = inject<Config | null>(CONFIG_INJECTION_KEY, null);
  assert(config);

  const characters = ref(new Array<Character>());
  const updateType = (id: string, type: string) => {
    const character = characters.value.find((c) => c.id === id) ?? false;
    if (!character) {
      const newCharacter: Character = { id, type, dynamicItems: [] };
      characters.value.push(newCharacter);
      return;
    }

    character.type = type;
  };

  const updateDynamicItems = (characterId: string, dynamicItemIds: string[]) => {
    const character = characters.value.find((i) => i.id === characterId);
    assert(character); // TODO: Handle this error more gracefully
    // TODO: either remove static items from dynamic items or report an error if they are present in both lists
    character.dynamicItems = [...dynamicItemIds];
  };

  const getItems = (characterId: string): string[] => {
    const character = characters.value.find((i) => i.id === characterId);
    assert(character); // TODO: Handle this error more gracefully

    const characterType = config.characterTypes.find(({ id }) => id === character.type);
    assert(characterType); // TODO: Handle this error more gracefully

    return [...characterType.staticItems, ...character.dynamicItems];
  };

  return { characters, updateType, updateDynamicItems, getItems };
});
