<script setup lang="ts">
import { useConfigStore } from "@renderer/stores/config";
import { computed } from "vue";

const { items } = useConfigStore();

const props = defineProps<{
  itemId: string;
}>();

const item = computed(() => items[props.itemId]);
</script>

<template>
  <span>
    <template v-if="item">{{ item.ui.icon }}</template>
    <template v-else>❓</template>
  </span>
</template>

<style scoped></style>
