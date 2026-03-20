<script setup lang="ts">
import { ref, computed, type DeepReadonly } from "vue";
import { watchImmediate } from "@vueuse/core";

import { useTokenStore } from "@/stores/token";
import { useConfigStore } from "@/stores/config";
import { useCharacterStore, type NonEmptySlotContent, type SlotContent } from "@/stores/characters";
import { useLanguageStore, provideLanguage } from "@/stores/language";
import AppIntro from "@/components/common/AppIntro.vue";
import LanguageSelector from "@/components/common/LanguageSelector.vue";
import TokenErrorPanel from "@/components/common/TokenErrorPanel.vue";
import CharacterProfile from "@/components/inventory/CharacterProfile.vue";
import ItemSlotGroup from "@/components/inventory/ItemSlotGroup.vue";
import ItemSlot from "@/components/inventory/ItemSlot.vue";
import ItemInsideSlot from "@/components/inventory/ItemInsideSlot.vue";
import NoItemInsideSlot from "@/components/inventory/NoItemInsideSlot.vue";
import ColorizedMonochromeImage from "@/components/common/ColorizedMonochromeImage.vue";
import { TokenStateType } from "@/types/token";
import { type CharacterTypeConfig, Language } from "@/types/config.ts";
import { storeToRefs } from "pinia";
import { useTokenErrorPanelVisibility } from "@/composables/use-token-error-panel-visibility.ts";
import LabeledPanel from "@/components/common/LabeledPanel.vue";
import TabbedItemPanel from "@/components/inventory/TabbedItemPanel.vue";
import InventoryFullPanel from "@/components/inventory/InventoryFullPanel.vue";
import invalidCharacterTypeImageHref from "@/assets/invalid-character-type.svg?url";
import invalidCharacterTypeCroppedImageHref from "@/assets/invalid-character-type-cropped.svg?url";
import invalidItemHref from "@/assets/invalid-item.svg?url";
import iconRemoveHref from "@/assets/icon-remove.svg?url";
import { INVENTORY_SIZE } from "@/constants.ts";

const { app, content } = useConfigStore();
const { characters } = storeToRefs(useCharacterStore());
const { ensureCharacter, removeItem } = useCharacterStore();

const language = ref<Language>(Language.PRIMARY);
const { useT } = useLanguageStore();
const t = useT(language);
provideLanguage(language); // use this language for all child components

const { inventory: tokenState } = storeToRefs(useTokenStore());

const { hidden: hideTokenErrorPanel } = useTokenErrorPanelVisibility(tokenState);

const lastActiveCharacterId = ref<string | null>(null);
watchImmediate(tokenState, () => {
  if (tokenState.value.state === TokenStateType.PRESENT) {
    // TODO: Move this somewhere else, maybe the character store?
    // Make sure a character for the token UID exists
    const { token } = tokenState.value;
    ensureCharacter(token.id, token.class);

    // Only update when a new token is present but not when it is removed.
    // This ensures that the inventory is still visible during animation of the app intro.
    lastActiveCharacterId.value = tokenState.value.token.id;
  }
});

const lastActiveCharacterData = computed(() => {
  if (lastActiveCharacterId.value === null) return null;

  const character = characters.value[lastActiveCharacterId.value];
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
    characterId: lastActiveCharacterId.value,
    characterTypeConfig,
    slotContents: {
      immutable: immutableSlotContents,
      mutable: mutableSlotContents,
    },
    inventoryFull: immutableSlotContents.length + nonLockedItems.length >= INVENTORY_SIZE,
  };
});

const iconRemoveUrl = new URL(iconRemoveHref);

const hideAppIntro = computed(() => tokenState.value.state === TokenStateType.PRESENT);
</script>

<template>
  <div class="full-hd-v-box inventory-app">
    <div v-if="lastActiveCharacterData !== null" class="character-with-inventory">
      <!-- hack to bind ephemeral lastActiveCharacterData value -->
      <template v-for="characterData in [lastActiveCharacterData]">
        <CharacterProfile :characterType="characterData.characterTypeConfig"></CharacterProfile>
        <div class="inventory">
          <div class="inventory-slots">
            <LabeledPanel
              class="locked-inventory-slots-panel"
              :label="t(app.inventory.selection.lockedSlots)"
            >
              <ItemSlotGroup>
                <div v-for="content in characterData.slotContents.immutable" class="slot">
                  <ItemSlot>
                    <ItemInsideSlot :item="content.config" class="item"></ItemInsideSlot>
                  </ItemSlot>
                </div>
              </ItemSlotGroup>
            </LabeledPanel>
            <LabeledPanel
              class="unlocked-inventory-slots-panel"
              :label="t(app.inventory.selection.slots)"
            >
              <ItemSlotGroup>
                <div v-for="content in characterData.slotContents.mutable" class="slot">
                  <ItemSlot
                    v-if="content.type === 'item'"
                    @badge-action="() => removeItem(characterData.characterId, content.config.id)"
                  >
                    <template v-slot:badge
                      ><ColorizedMonochromeImage
                        :url="iconRemoveUrl"
                        class="badge-icon"
                      ></ColorizedMonochromeImage
                    ></template>
                    <ItemInsideSlot :item="content.config" class="item"> </ItemInsideSlot>
                  </ItemSlot>
                  <ItemSlot v-else-if="content.type === 'invalid'">
                    <ItemInsideSlot :item="content.config" class="item"> </ItemInsideSlot>
                  </ItemSlot>
                  <ItemSlot v-else>
                    <NoItemInsideSlot class="no-item"></NoItemInsideSlot>
                  </ItemSlot>
                </div>
              </ItemSlotGroup>
            </LabeledPanel>
          </div>
          <div class="item-selector-box">
            <div class="item-selector-inner-box">
              <TabbedItemPanel :characterId="characterData.characterId"></TabbedItemPanel>
              <InventoryFullPanel v-if="characterData.inventoryFull"></InventoryFullPanel>
            </div>
          </div>
        </div>
        <div class="language-selector">
          <LanguageSelector :hasDarkBackground="false"></LanguageSelector>
        </div>
      </template>
    </div>
    <AppIntro
      :name="app.inventory.intro.name"
      :description="app.inventory.intro.title"
      class="app-intro app-padding"
      :class="{ 'app-intro-hidden': hideAppIntro }"
      ><div class="app-intro-text text-style-h1">
        <div>{{ t(app.inventory.intro.description) }}</div>
      </div>
    </AppIntro>
    <TokenErrorPanel
      :tokenState="tokenState"
      :class="{ 'token-error-panel-hidden': hideTokenErrorPanel }"
    ></TokenErrorPanel>
  </div>
</template>

<style scoped>
.inventory-app {
  position: relative;
  background-color: var(--color-backdrop-dark);
  --padding-color: transparent;
}

.app-intro {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: translate(0%, 0%);
  transition: transform 0.5s ease-in-out;
  background-color: var(--color-backdrop-dark);
}

.app-intro.app-intro-hidden {
  transform: translate(0%, 100%);
}

.app-intro-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  top: -0.5ex;
  height: 100%;
  color: var(--color-secondary);
}

.character-with-inventory {
  position: relative;
  width: 100%;
  height: 100%;
}

.language-selector {
  position: absolute;
  bottom: var(--app-padding);
  margin-bottom: -14px;
  display: flex;
  justify-content: center;
  width: 100%;
}

.inventory {
  position: relative;
  border-style: solid;
  border-width: 87px var(--app-padding) var(--app-padding) var(--app-padding);
  border-color: var(--padding-color);
  width: 100%;
  height: calc(100% - 660px);
  background-color: var(--color-backdrop-light);
}

.inventory-slots {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;

  .locked-inventory-slots-panel {
    --label-color: var(--color-white);
    --label-background-color: var(--color-secondary);
    --label-image: url("@/assets/icon-inventory-locked.svg");
    --border-color: var(--color-secondary);
    --background-color: var(--color-secondary-inactive);

    .item {
      --background-color: color-mix(in srgb, var(--color-card-inactive) 65%, transparent);
      --label-color: var(--color-primary-inactive);
      --accent-color: var(--color-primary-inactive);
    }
  }

  .unlocked-inventory-slots-panel {
    --label-color: var(--color-white);
    --label-background-color: var(--color-button);
    --label-image: url("@/assets/icon-inventory.svg");
    --border-color: var(--color-primary);
    --background-color: var(--color-button-inactive);

    .slot {
      --badge-background-color: var(--color-secondary);
      --accent-color: var(--color-white);

      .badge-icon {
        width: 100%;
        height: 100%;
      }

      .item {
        --background-color: var(--color-button);
        --label-color: var(--color-white);
        --accent-color: var(--color-primary);
      }
    }

    .no-item {
    }
  }
}

.item-selector-box {
  margin-top: 72px;
  position: relative;
  width: 100%;
  height: 770px;
  border: 2px solid var(--color-primary);
  border-radius: 32px;
  background-color: var(--color-white);
  padding: 8px;

  .item-selector-inner-box {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 26px;
    overflow: hidden;
  }
}

.token-error-panel {
  transform: translate(0%, 0%);
  transition: transform 0.5s ease-in-out;
}

.token-error-panel.token-error-panel-hidden {
  transform: translate(0%, 100%);
}
</style>
