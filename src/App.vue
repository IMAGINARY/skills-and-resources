<script setup lang="ts">
import ChallengeApp from "@/components/challenge/App.vue";
import InventoryApp from "@/components/inventory/App.vue";
import ScaledLetterBox from "@/components/common/ScaledLetterBox.vue";
import { useOptionsStore } from "@/stores/options.ts";

const { options } = useOptionsStore();
const { flipSides } = options;
</script>

<template>
  <ScaledLetterBox :target-size="{ width: 2 * 1080, height: 1920 }" class="scaled-letter-box">
    <div class="sub-app-container" :class="{ 'flip-sides': flipSides }">
      <InventoryApp></InventoryApp>
      <ChallengeApp></ChallengeApp>
    </div>
  </ScaledLetterBox>
</template>

<style scoped>
.scaled-letter-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.sub-app-container {
  display: flex;
  flex-direction: row;
  background-color: var(--app-background-color);
  color: var(--app-text-color);
}

.sub-app-container:not(.flip-sides) {
  flex-direction: row;
}

.sub-app-container.flip-sides {
  flex-direction: row-reverse;
}
</style>
