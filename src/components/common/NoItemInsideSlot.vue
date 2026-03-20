<script setup lang="ts">
import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";

const { app } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();
</script>

<template>
  <div class="no-item">{{ t(app.inventory.selection.slotEmpty) }}</div>
</template>

<style scoped>
.no-item {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: var(--color-buttontext-inactive);
}
</style>
