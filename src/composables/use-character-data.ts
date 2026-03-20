import { computed, toValue, type DeepReadonly, type MaybeRefOrGetter } from "vue";
import { useConfigStore } from "@/stores/config.ts";
import { useCharacterStore } from "@/stores/characters.ts";
import type { CharacterTypeConfig, ItemConfig } from "@/types/config.ts";
import { INVENTORY_SIZE } from "@/constants.ts";
import { storeToRefs } from "pinia";
import invalidCharacterTypeImageHref from "@/assets/invalid-character-type.svg?url";
import invalidCharacterTypeCroppedImageHref from "@/assets/invalid-character-type-cropped.svg?url";
import invalidItemHref from "@/assets/invalid-item.svg?url";

export type NonEmptySlotContent =
  | { type: "item"; config: DeepReadonly<ItemConfig> }
  | { type: "invalid"; config: DeepReadonly<ItemConfig> };

export type SlotContent = NonEmptySlotContent | { type: "empty" };

export type CharacterData = {
  characterId: string;
  characterTypeConfig: DeepReadonly<CharacterTypeConfig>;
  slotContents: {
    immutable: NonEmptySlotContent[];
    mutable: SlotContent[];
  };
  inventoryFull: boolean;
};

export function useCharacterData(characterId: MaybeRefOrGetter<string | null>) {
  const { app, content } = useConfigStore();
  const { characters } = storeToRefs(useCharacterStore());

  return computed(() => {
    const characterIdValue = toValue(characterId);

    if (characterIdValue === null) return null;

    const character = characters.value[characterIdValue];
    if (typeof character === "undefined") return null;

    const toNonEmptySlotContent = (itemId: string): NonEmptySlotContent => {
      const itemConfig = content.items.find(({ id }) => id === itemId);
      if (typeof itemConfig === "undefined") {
        return {
          type: "invalid",
          config: {
            id: itemId,
            type: "skill", // TODO: Create additional internal 'invalid' Item type
            icon: new URL(invalidItemHref),
            ...app.misc.invalidItem,
          },
        };
      }
      return { type: "item", config: itemConfig };
    };

    const characterTypeConfig: DeepReadonly<CharacterTypeConfig> = content.characterTypes.find(
      ({ id }) => id === character.type,
    ) ?? {
      id: character.type,
      items: new Array<string>(),
      image: new URL(invalidCharacterTypeImageHref),
      croppedImage: new URL(invalidCharacterTypeCroppedImageHref),
      ...app.misc.invalidCharacterType,
    };
    const immutableSlotContents: NonEmptySlotContent[] = character.inventory
      .filter((i) => i.locked)
      .map(({ itemId }) => toNonEmptySlotContent(itemId));
    const nonLockedItems = character.inventory.filter((i) => !i.locked).map(({ itemId }) => itemId);
    const numEmptySlots = INVENTORY_SIZE - immutableSlotContents.length - nonLockedItems.length;
    const mutableSlotContents: SlotContent[] = [
      ...nonLockedItems.map(toNonEmptySlotContent),
      ...Array.from({ length: numEmptySlots }).map(() => ({ type: "empty" as const })),
    ];

    return {
      characterId: characterIdValue,
      characterTypeConfig,
      slotContents: {
        immutable: immutableSlotContents,
        mutable: mutableSlotContents,
      },
      inventoryFull: immutableSlotContents.length + nonLockedItems.length >= INVENTORY_SIZE,
    };
  });
}
