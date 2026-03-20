<script setup lang="ts">
import { useTap } from "@/composables/use-tap.ts";

defineEmits<{
  "badge-action": [];
}>();
</script>

<template>
  <div class="slot-wrapper">
    <div class="slot">
      <div class="content"><slot></slot></div>
    </div>
    <div v-if="$slots.badge" class="badge" v-drag="useTap(() => $emit('badge-action'))">
      <slot name="badge"></slot>
    </div>
  </div>
</template>

<style scoped>
.slot-wrapper {
  position: relative;
}

.slot {
  position: relative;
  width: 165px;
  height: 165px;
  border-radius: 7px;
  background: var(--color-white);
  padding: 4px;
  overflow: hidden;

  & > .content {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 4px;
    overflow: hidden;
  }
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-style: solid;
  border-width: 3px;
  border-radius: 50%;
  border-color: var(--color-white);
  background-color: var(--badge-background-color, black);
  transform: translate(6px, -6px);
}
</style>
