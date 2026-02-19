<script setup lang="ts">
import type { DeepReadonly } from "vue";
import { computed } from "vue";
import { type ItemConfig, Language } from "@/types/config";

import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";
import ItemThumbnail from "@/components/ItemThumbnail.vue";

const props = defineProps<{
  language: Language;
  itemId: string;
  highlight?: boolean;
  locked?: boolean;
}>();

const { items } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();

const item = computed<DeepReadonly<ItemConfig | null>>(() => items[props.itemId] ?? null);
</script>

<template>
  <UCard
    v-if="item"
    variant="subtle"
    :highlight="highlight ?? false"
    class="min-w-80 max-w-80 aspect-[1/1.414] rounded-2xl overflow-hidden"
    :ui="{
      header: 'bg-accented',
      root: `relative ${highlight ? 'outline-3 outline-accented' : ''}`,
      footer: 'absolute bottom-0 right-0',
    }"
  >
    <template #header>
      <div class="flex items-center text-2xl">
        <ItemThumbnail :item-id="item.id" class="text-5xl" />
        <div class="ms-5">
          <div>{{ t(item.title, language) }}</div>
        </div>
      </div>
    </template>
    <div class="mt-3 text-2xl">
      <p>{{ t(item.description, language) }}</p>
    </div>
    <template #footer v-if="locked"><span class="text-5xl">🔒</span></template>
  </UCard>

  <UPageCard v-else class="aspect-[1/1.414]" title="Unknown item" />
</template>

<style scoped></style>
