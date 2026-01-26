<script setup lang="ts">
import type { DeepReadonly } from "vue";
import type { Item } from "@renderer/config/config";

defineProps<{
  item: DeepReadonly<Item>;
}>();
</script>

<template>
  <span>{{ item.ui.icon }}</span>
</template>

<style scoped></style>
