<script setup lang="ts">
import { ref, toValue, type MaybeRefOrGetter, type DeepReadonly } from "vue";

import { useCharacterStore } from "@/stores/characters";
import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";
import InventoryFullPanel from "@/components/inventory/InventoryFullPanel.vue";
import ColorizedMonochromeImage from "@/components/common/ColorizedMonochromeImage.vue";
import { useTap } from "@/composables/use-tap.ts";
import { type ItemType, ItemTypes } from "@/types/config.ts";

const props = defineProps<{
  characterId: MaybeRefOrGetter<DeepReadonly<string>>;
  inventoryFull: boolean;
}>();

const { app, content } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();

const { hasItem, isItemLocked, toggleItem } = useCharacterStore();

const activeItemType = ref<ItemType>("skill");
</script>

<template>
  <div class="item-selector-panel">
    <div class="item-selector-panel-inner" :class="{ invisible: props.inventoryFull }">
      <div class="header text-style-tab">
        <div
          class="tab left"
          :class="{ active: activeItemType === 'skill' }"
          v-drag="useTap(() => (activeItemType = 'skill'))"
        >
          {{ t(app.inventory.selection.skills) }}
        </div>
        <div
          class="tab right"
          :class="{ active: activeItemType === 'resource' }"
          v-drag="useTap(() => (activeItemType = 'resource'))"
        >
          {{ t(app.inventory.selection.resources) }}
        </div>
      </div>
      <div class="body">
        <div
          v-for="itemType in ItemTypes"
          :key="itemType"
          class="content-panels"
          :class="[itemType, { invisible: itemType !== activeItemType }]"
        >
          <div
            v-for="item in content.items.filter(({ type }) => type === itemType)"
            :key="item.id"
            class="item"
            :class="[
              hasItem(toValue(characterId), item.id)
                ? isItemLocked(toValue(characterId), item.id)
                  ? 'locked'
                  : 'active'
                : 'inactive',
            ]"
            v-drag="useTap(() => toggleItem(toValue(characterId), item.id))"
          >
            <div class="icon">
              <ColorizedMonochromeImage :url="item.icon"></ColorizedMonochromeImage>
            </div>
            <div class="brief">
              <div class="text-style-h3">{{ t(item.title) }}</div>
              <div class="text-style-card">{{ t(item.description) }}</div>
            </div>
            <div class="badge"><div class="icon"></div></div>
          </div>
        </div>
      </div>
    </div>
    <div class="inventory-full" :class="{ hidden: !props.inventoryFull }">
      <div><InventoryFullPanel></InventoryFullPanel></div>
    </div>
  </div>
</template>

<style scoped>
.item-selector-panel {
  position: relative;
  width: 960px;
  height: 748px;
  --border-width: 2px;
  --border-color: var(--color-primary);
  --border-radius: 32px;
  --border-radius-inner: 26px;
  --bg-color: var(--color-white);
  --padding: 8px;

  .inventory-full {
    position: absolute;
    width: 100%;
    height: 100%;
    border: var(--border-width) solid var(--color-primary);
    border-radius: var(--border-radius);
    background-color: var(--bg-color);
    padding: var(--padding);
    overflow: hidden;

    > * {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: var(--border-radius-inner);
      overflow: hidden;
    }
  }

  .item-selector-panel-inner {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .header {
      position: relative;
      height: 68px;
      overflow: visible;
      display: flex;
      flex-direction: row;

      .tab {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .tab.active {
        position: relative;
        width: calc(50% + 0.5 * var(--border-width));
        height: calc(100% + var(--border-width));
        border-style: solid solid none solid;
        border-color: var(--border-color);
        padding-bottom: var(--border-width);
        background-color: var(--bg-color);
        color: var(--color-button);
      }

      .tab.active:after {
        /* This is to overpaint parts of the border of the body below the active tab */
        content: "";
        position: absolute;
        width: 100%;
        height: calc(4 * var(--border-width));
        bottom: calc(-1 * var(--border-width));
        left: 0;
        background-color: var(--bg-color);
      }

      .tab.left.active {
        border-width: var(--border-width) var(--border-width) 0 var(--border-width);
        border-radius: var(--border-radius) 0 0 0;
      }

      .tab.right.active {
        border-width: var(--border-width) var(--border-width) 0 var(--border-width);
        border-radius: 0 var(--border-radius) 0 0;
      }

      .tab:not(.active) {
        width: calc(50% - 0.5 * var(--border-width));
        border-style: solid;
        border-color: transparent;
        border-width: var(--border-width) var(--border-width) 0 0;
        border-radius: 0 var(--border-radius) 0 0;
        background-clip: padding-box;
        background-color: var(--color-button);
        color: var(--color-white);
      }

      .tab.left:not(.active) {
        border-width: var(--border-width) 0 0 var(--border-width);
        border-radius: var(--border-radius) 0 0 0;
      }

      .tab.right:not(.active) {
        border-width: var(--border-width) var(--border-width) 0 0;
        border-radius: 0 var(--border-radius) 0 0;
      }
    }

    .body {
      flex-grow: 1;
      padding: var(--padding);
      border-style: solid;
      border-color: var(--border-color);
      border-width: var(--border-width);
      border-radius: 0 0 var(--border-radius) var(--border-radius);
      background-color: var(--color-white);
      display: grid;
      grid-template-columns: 100% 100%;
      grid-template-rows: 100% 100%;

      > * {
        grid-area: 1 / 1 / 2 / 2;
      }
    }
  }
}

.content-panels {
  position: relative;
  width: 100%;
  min-height: 40px;
  border-radius: 20px;
  overflow: hidden;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: 161px;
  gap: 5px;

  .item {
    position: relative;
    padding: 20px 15px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 15px;

    .icon {
      width: 83px;
    }

    .brief {
      display: flex;
      flex-direction: column;
      gap: 15px;
      height: 100%;
    }

    .badge {
      position: absolute;
      top: 5px;
      left: 5px;
      width: 31px;
      height: 31px;
      border-radius: 50%;
      overflow: hidden;

      .icon {
        width: 100%;
        height: 100%;
        background: var(--color-white);
        mask-size: contain;
        mask-mode: luminance;
        mask-image: var(--label-image);
      }
    }

    &.inactive {
      background-color: var(--color-primary);
      color: var(--color-white);
      --accent-color: var(--color-button);
      .badge {
        background-color: var(--color-primary);
        .icon {
          mask-image: url("@/assets/icon-add.svg");
        }
      }
    }

    &.active {
      background-color: var(--color-button);
      color: var(--color-white);
      --accent-color: var(--color-primary);
      .badge {
        background-color: var(--color-button);
        .icon {
          mask-image: url("@/assets/icon-inventory.svg");
        }
      }
    }

    &.locked {
      background-color: color-mix(in srgb, var(--color-card-inactive) 65%, transparent);
      color: var(--color-primary-inactive);
      --accent-color: var(--color-primary-inactive);
      .badge {
        background-color: var(--color-secondary);
        .icon {
          mask-image: url("@/assets/icon-inventory-locked.svg");
        }
      }
    }
  }
}

.hidden {
  display: none;
}

.invisible {
  visibility: hidden;
}
</style>
