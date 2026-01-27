<script setup lang="ts">
import type { DeepReadonly } from "vue";
import type { Item } from "@renderer/config/config";

import { useConfigStore } from "@renderer/stores/config";
import ItemThumbnail from "@renderer/components/ItemThumbnail.vue";

defineProps<{
  item: DeepReadonly<Item>;
  isStatic: boolean;
}>();

const { t1st, t2nd } = useConfigStore();
</script>

<template>
  <div>
    <ItemThumbnail :item="item"></ItemThumbnail>
    <div>{{ t1st(item.ui.title) }}</div>
    <div>{{ t2nd(item.ui.title) }}</div>
    <div>{{ t1st(item.ui.description) }}</div>
    <div>{{ t2nd(item.ui.description) }}</div>
  </div>
</template>

<style scoped></style>
