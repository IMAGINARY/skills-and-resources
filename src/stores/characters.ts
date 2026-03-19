import { reactive, toValue, type DeepReadonly } from "vue";
import { defineStore } from "pinia";
import { strict as assert } from "assert";

import { INVENTORY_SIZE } from "@/constants";
import { useConfigStore } from "@/stores/config";
import { type ItemConfig } from "@/types/config";

export type InventorySlot = {
  locked: boolean;
  itemId: string;
};

export type NonEmptySlotContent =
  | { type: "item"; config: DeepReadonly<ItemConfig> }
  | { type: "invalid"; config: DeepReadonly<ItemConfig> };

export type SlotContent = NonEmptySlotContent | { type: "empty" };

export type Character = {
  readonly id: string;
  type: string;
  inventory: InventorySlot[];
};

export const useCharacterStore = defineStore("characters", () => {
  const { content } = useConfigStore();

  const randomCharacterType = () => {
    assert(content.characterTypes.length > 0);
    const randomIdx = Math.floor(Math.random() * content.characterTypes.length);
    assert(typeof content.characterTypes[randomIdx] !== "undefined");
    return content.characterTypes[randomIdx].id;
  };

  const createInventory = (type: string): InventorySlot[] => {
    const items = content.characterTypes.find(({ id }) => id === type)?.items;
    assert(typeof items !== "undefined");
    const inventory = items.map((id) => ({ locked: true, itemId: id }));

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

  const hasItem = (characterId: string, itemId: string) => {
    return characters[characterId]?.inventory.findIndex(({ itemId: iid }) => iid == itemId) !== -1;
  };

  const addItem = (characterId: string, itemId: string) => {
    if (!characters?.[characterId]) {
      ensureCharacter(characterId);
      return toggleItem(characterId, itemId);
    }

    if (hasItem(characterId, itemId)) return true;

    // try to add the item
    if (characters[characterId].inventory.length >= INVENTORY_SIZE)
      // no space left
      return false;

    characters[characterId].inventory.push({ locked: false, itemId: itemId });
    return true;
  };

  const removeItem = (characterId: string, itemId: string) => {
    if (!characters?.[characterId]) {
      ensureCharacter(characterId);
      return removeItem(characterId, itemId);
    }

    if (!hasItem(characterId, itemId)) return false;

    const idx = characters[characterId].inventory.findIndex(({ itemId: iid }) => iid == itemId);
    if (typeof characters[characterId].inventory[idx] === "undefined") return false;

    // try to remove the item
    if (characters[characterId].inventory[idx].locked)
      // item will be kept because it is locked
      return true;

    characters[characterId].inventory.splice(idx, 1);
    return true; // item is absent now
  };

  /**
   * Toggles an item in the character inventory and returns whether it is present after the operation.
   */
  const toggleItem = (characterId: string, itemId: string): boolean => {
    return hasItem(characterId, itemId)
      ? removeItem(characterId, itemId)
      : addItem(characterId, itemId);
  };

  const isItemLocked = (characterId: string, itemId: string) => {
    return (
      characters[characterId]?.inventory.find(({ itemId: iid }) => iid == itemId)?.locked ?? false
    );
  };

  return { characters, ensureCharacter, addItem, removeItem, toggleItem, hasItem, isItemLocked };
});
