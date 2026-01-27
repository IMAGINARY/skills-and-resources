<script setup lang="ts">
import { computed, DeepReadonly } from "vue";
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
  <div v-if="item">
    <ItemThumbnail :item-id="item.id"></ItemThumbnail>
    <div>{{ t1st(item.ui.title) }}</div>
    <div>{{ t2nd(item.ui.title) }}</div>
    <div>{{ t1st(item.ui.description) }}</div>
    <div>{{ t2nd(item.ui.description) }}</div>
  </div>
  <div v-else>Unknown item</div>
</template>

<style scoped></style>
