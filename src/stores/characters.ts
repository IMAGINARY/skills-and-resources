import type { Config } from "@/config/config";

import { inject, reactive, toValue } from "vue";
import { defineStore } from "pinia";
import { strict as assert } from "assert";

import { CONFIG_INJECTION_KEY, INVENTORY_SIZE } from "@/constants";

export type InventorySlot = {
  locked: boolean;
  itemId: string;
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
    assert(typeof config.characterTypes[randomIdx] !== "undefined");
    return config.characterTypes[randomIdx].id;
  };

  const createInventory = (type: string): InventorySlot[] => {
    const staticItems = config.characterTypes.find(({ id }) => id === type)?.staticItems;
    assert(typeof staticItems !== "undefined");
    const inventory = staticItems.map((id) => ({ locked: true, itemId: id }));

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

  /**
   * Toggles an item in the character inventory and returns whether it is present after the operation.
   */
  const toggleItem = (characterId: string, itemId: string): boolean => {
    if (!characters?.[characterId]) {
      ensureCharacter(characterId);
      return toggleItem(characterId, itemId);
    }

    const idx = characters[characterId].inventory.findIndex(({ itemId: iid }) => iid == itemId);
    if (typeof characters[characterId].inventory[idx] === "undefined") {
      // try to add the item

      if (characters[characterId].inventory.length >= INVENTORY_SIZE)
        // no space left
        return false;

      characters[characterId].inventory.push({ locked: false, itemId: itemId });
      return true;
    } else {
      // try to remove the item

      if (characters[characterId].inventory[idx].locked)
        // item will be kept because it is locked
        return true;

      characters[characterId].inventory.splice(idx, 1);
      return true; // item is absent now
    }
  };

  const hasItem = (characterId: string, itemId: string) => {
    return characters[characterId]?.inventory.findIndex(({ itemId: iid }) => iid == itemId) !== -1;
  };

  const isItemLocked = (characterId: string, itemId: string) => {
    return (
      characters[characterId]?.inventory.find(({ itemId: iid }) => iid == itemId)?.locked ?? false
    );
  };

  return { characters, ensureCharacter, toggleItem, hasItem, isItemLocked };
});
