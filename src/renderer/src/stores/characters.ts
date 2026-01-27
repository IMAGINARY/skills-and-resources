import type { Config } from "@renderer/config/config";

import { inject, reactive, toValue } from "vue";
import { defineStore } from "pinia";
import { strict as assert } from "assert";

import { CONFIG_INJECTION_KEY, INVENTORY_SIZE } from "@renderer/constants";

export type InventorySlot = {
  readonly isReadonly: boolean;
  item: string | null;
};

export type Character = {
  readonly id: string;
  type: string;
  inventory: InventorySlot[];
};

export const useCharacterStore = defineStore("characters", () => {
  const config = inject<Config | null>(CONFIG_INJECTION_KEY, null);
  assert(config);

  const randomCharacterType = () => {
    assert(config.characterTypes.length > 0);
    const randomIdx = Math.floor(Math.random() * config.characterTypes.length);
    return config.characterTypes[randomIdx].id;
  };

  const createInventory = (type: string): InventorySlot[] => {
    const staticItems = config.characterTypes.find(({ id }) => id === type)?.staticItems;
    assert(typeof staticItems !== "undefined");
    const inventory = (Array<InventorySlot>).from({ length: INVENTORY_SIZE }, (_, i) => {
      return i < staticItems.length
        ? { isReadonly: true, item: staticItems[i] }
        : { isReadonly: false, item: null };
    });
    return inventory;
  };

  const characters = reactive<Record<string, Character>>({});

  const ensureCharacter = (id: string, type: string = randomCharacterType()) => {
    if (characters[id]) {
      if (characters[id].type !== type) {
        characters[id].type = type;
        characters[id].inventory = createInventory(type);
      }
    } else {
      characters[id] = {
        id,
        type: toValue(type),
        inventory: createInventory(type),
      };
    }
  };

  const setItem = (characterId: string, slotIndex: number, itemId: string) => {
    if (
      characters?.[characterId]?.inventory?.[slotIndex] &&
      characters?.[characterId]?.inventory?.[slotIndex].isReadonly !== true
    ) {
      // Deep reactivity ensures this nested update is tracked
      characters[characterId].inventory[slotIndex].item = itemId;
    }
  };

  const unsetItem = (characterId: string, slotIndex: number) => {
    if (
      characters?.[characterId]?.inventory?.[slotIndex] &&
      characters?.[characterId]?.inventory?.[slotIndex].isReadonly !== true
    ) {
      // Deep reactivity ensures this nested update is tracked
      characters[characterId].inventory[slotIndex].item = null;
    }
  };

  return { characters, ensureCharacter, setItem, unsetItem };
});
