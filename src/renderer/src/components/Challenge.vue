<script setup lang="ts">
import { computed, DeepReadonly } from "vue";
import type { Challenge } from "@renderer/config/config";

import { useConfigStore } from "@renderer/stores/config";
import ItemThumbnail from "@renderer/components/ItemThumbnail.vue";

const props = defineProps<{
  challenge: DeepReadonly<Challenge>;
}>();

const { config, t1st, t2nd } = useConfigStore();

const solution = computed(() =>
  props.challenge.solution.map(
    (id) => config.items.find(({ id: itemId }) => itemId === id) ?? false,
  ),
);
</script>

<template>
  <div>
    <div>{{ props.challenge.ui.icon }}</div>
    <div>{{ t1st(props.challenge.ui.title) }}</div>
    <div>{{ t2nd(props.challenge.ui.title) }}</div>
    <div>{{ t1st(props.challenge.ui.description) }}</div>
    <div>{{ t2nd(props.challenge.ui.description) }}</div>
    <div>
      <template v-for="item in solution">
        <ItemThumbnail v-if="item" :item="item" :key="item.id"></ItemThumbnail>
      </template>
    </div>
  </div>
</template>

<style scoped></style>
