<script setup lang="ts">
import type { DeepReadonly } from "vue";
import { computed } from "vue";
import type { Item } from "@renderer/config/config";

import { useConfigStore } from "@renderer/stores/config";
import ItemThumbnail from "@renderer/components/ItemThumbnail.vue";

const props = defineProps<{
  itemId: string;
}>();

const { items, t1st, t2nd } = useConfigStore();

const item = computed<DeepReadonly<Item>>(() => items[props.itemId]);
</script>

<template>
  <UPageCard v-if="item" variant="subtle" class="aspect-[1/1.414]">
    <template #title>
      <div class="-m-4 sm:-m-6 mb-4 p-4 sm:p-6 bg-accented rounded-t-lg">
        <div class="flex items-center gap-4">
          <ItemThumbnail :item-id="item.id" class="text-3xl" />
          <div>
            <div>{{ t1st(item.ui.title) }}</div>
            <div>{{ t2nd(item.ui.title) }}</div>
          </div>
        </div>
      </div>
    </template>

    <template #description>
      <div class="mt-10 text-lg">
        <div>{{ t1st(item.ui.description) }}</div>
        <div>{{ t2nd(item.ui.description) }}</div>
      </div>
    </template>
  </UPageCard>
  <UPageCard v-else variant="subtle" class="aspect-[1/1.414]" title="Unknown item" />
</template>

<style scoped></style>
