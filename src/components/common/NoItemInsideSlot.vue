<script setup lang="ts">
import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";
import { useTap } from "@/composables/use-tap.ts";
import { useTooltip } from "@/composables/use-tooltip.ts";
import TooltipTransition from "@/components/common/TooltipTransition.vue";

const { app } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();

const { showTooltip, toggleTooltip } = useTooltip();
</script>

<template>
  <div class="no-item text-style-card" v-drag="useTap(toggleTooltip)">
    <TooltipTransition>
      <div v-if="showTooltip">{{ t(app.inventory.selection.slotEmptyHint) }}</div>
      <div v-else>{{ t(app.inventory.selection.slotEmpty) }}</div>
    </TooltipTransition>
  </div>
</template>

<style scoped>
.no-item {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: transparent;
  color: var(--color-buttontext-inactive);
  padding: 8px;
}
</style>
