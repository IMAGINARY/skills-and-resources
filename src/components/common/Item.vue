<script setup lang="ts">
import type { DeepReadonly } from "vue";
import { computed } from "vue";
import { type ItemConfig, Language } from "@/types/config";

import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";
import ItemThumbnail from "@/components/common/ItemThumbnail.vue";

const props = withDefaults(
  defineProps<{
    language: Language;
    itemId: string;
    highlight?: boolean;
    locked?: boolean;
  }>(),
  { highlight: false, locked: false },
);

const { items } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();

const item = computed<DeepReadonly<ItemConfig | null>>(() => items[props.itemId] ?? null);
</script>

<template>
  <div v-if="item" :class="{ highlight }" :highlight="highlight ?? false">
    <template #header>
      <div class="flex items-center text-2xl">
        <div class="icon"><ItemThumbnail :item-id="item.id" cssAccentColor="green" /></div>
        <div class="ms-5">
          <div>{{ t(item.title) }}</div>
        </div>
      </div>
    </template>
    <div class="mt-3 text-2xl">
      <p>{{ t(item.description) }}</p>
    </div>
    <template #footer v-if="locked"><span class="text-5xl">🔒</span></template>
  </div>
  <div v-else>Unknown item</div>
</template>

<style scoped>
.icon {
  width: 100px;
  height: 100px;
  object-fit: cover;
  --accent-color: green; /* color just for testing */
}

.highlight {
  /* TODO */
}
</style>
