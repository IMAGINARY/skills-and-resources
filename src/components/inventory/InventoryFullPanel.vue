<script setup lang="ts">
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";

import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";

import drawArrowUpperLeftUrl from "@/assets/draw-arrow-upper-left.lottie?url";

const { app } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();
</script>

<template>
  <div class="inventory-full-panel">
    <div class="full text-style-h2">{{ t(app.inventory.selection.full) }}</div>
    <div class="full-hint text-style-card">{{ t(app.inventory.selection.fullHint) }}</div>
    <div class="continue-condition text-style-h3">
      {{ t(app.inventory.selection.continueCondition) }}
    </div>
    <div class="continue-hint text-style-h2">{{ t(app.inventory.selection.continueHint) }}</div>
    <DotLottieVue class="arrow" autoplay loop :src="drawArrowUpperLeftUrl" />
  </div>
</template>

<style scoped>
.inventory-full-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: color-mix(var(--color-backdrop-dark) 95%, transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 70px 8px 70px;

  .full {
    color: var(--color-secondary);
    margin-bottom: 19px;
  }

  .full-hint {
    color: var(--color-white);
    margin-bottom: 120px;
  }

  .continue-condition {
    color: var(--color-white);
    margin-bottom: 21px;
  }

  .continue-hint {
    color: var(--color-button);
  }

  .arrow {
    position: absolute;
    bottom: 50px;
    right: 40px;
    width: 172px;
    transform: scale(1, -1) rotate(calc(180deg - 55deg));
  }
}
</style>
