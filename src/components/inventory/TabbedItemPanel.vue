<script setup lang="ts">
import { ref, toValue, type MaybeRefOrGetter, type DeepReadonly } from "vue";

import { useCharacterStore } from "@/stores/characters";
import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";
import ColorizedMonochromeImage from "@/components/common/ColorizedMonochromeImage.vue";
import { useTap } from "@/composables/use-tap.ts";
import type { ItemType } from "@/types/config.ts";

const props = defineProps<{ characterId: MaybeRefOrGetter<DeepReadonly<string>> }>();

const { app, content } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();

const { hasItem, isItemLocked, toggleItem } = useCharacterStore();

const activeItemType = ref<ItemType>("skill");
</script>

<template>
  <div>
    <div class="tabs text-style-tab">
      <div
        :class="{ active: activeItemType === 'skill' }"
        v-drag="useTap(() => (activeItemType = 'skill'))"
      >
        {{ t(app.inventory.selection.skills) }}
      </div>
      <div
        :class="{ active: activeItemType === 'resource' }"
        v-drag="useTap(() => (activeItemType = 'resource'))"
      >
        {{ t(app.inventory.selection.resources) }}
      </div>
    </div>
    <div class="content-panels" :class="{ switch: activeItemType === 'skill' }">
      <div
        v-for="item in content.items.filter(({ type }) => type === activeItemType)"
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
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  flex-direction: row;
  align-content: stretch;
  margin-bottom: 38px;

  & > div {
    flex: 1;
    text-align: center;
    height: 52px;
    border-radius: 26px;
    display: flex;
    justify-content: center;
    align-items: center;

    &.active {
      color: var(--color-white);
      background-color: var(--color-button);
    }

    &:not(.active) {
      color: var(--color-button);
      background-color: transparent;
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
</style>
