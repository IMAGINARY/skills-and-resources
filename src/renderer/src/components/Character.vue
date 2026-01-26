<script setup lang="ts">
import type { DeepReadonly } from "vue";
import type { Character } from "@renderer/stores/characters";

import { computed } from "vue";
import { useConfigStore } from "@renderer/stores/config";
import ItemThumbnail from "@renderer/components/ItemThumbnail.vue";

const props = defineProps<{
  character: DeepReadonly<Character>;
}>();

const { config, t1st, t2nd } = useConfigStore();

const characterClass = computed(() =>
  config.characterClasses.find(({ id }) => id === props.character.class),
);
const staticItems = computed(
  () =>
    characterClass.value?.staticItems.map(
      (id) => config.items.find(({ id: itemId }) => itemId === id) ?? false,
    ) ?? [],
);
const dynamicItems = computed(() =>
  props.character.dynamicItems.map(
    (id) => config.items.find(({ id: itemId }) => itemId === id) ?? false,
  ),
);
</script>

<template>
  <div v-if="characterClass">
    <div>{{ characterClass.ui.icon }}</div>
    <div>ID: {{ props.character.id }} Class: {{ props.character.class }}</div>
    <div>{{ t1st(characterClass.ui.title) }}</div>
    <div>{{ t2nd(characterClass.ui.title) }}</div>
    <div>{{ t1st(characterClass.ui.description) }}</div>
    <div>{{ t2nd(characterClass.ui.description) }}</div>
    <div>
      <template v-for="item in staticItems">
        <ItemThumbnail v-if="item" :item="item" :key="item.id"></ItemThumbnail>
      </template>
      <template v-for="item in dynamicItems">
        <ItemThumbnail v-if="item" :item="item" :key="item.id"></ItemThumbnail>
      </template>
    </div>
  </div>
  <div v-else>Unknown character class</div>
</template>

<style scoped></style>
