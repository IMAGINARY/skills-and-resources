<script setup lang="ts">
import ChallengeApp from "@/components/ChallengeApp.vue";
import InventoryApp from "@/components/InventoryApp.vue";
import ScaledLetterBox from "@/components/ScaledLetterBox.vue";
</script>

<template>
  <ScaledLetterBox :target-size="{ width: 2 * 1080, height: 1920 }" class="scaled-letter-box">
    <div class="sub-app-container">
      <ChallengeApp></ChallengeApp>
      <InventoryApp></InventoryApp>
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
</style>
