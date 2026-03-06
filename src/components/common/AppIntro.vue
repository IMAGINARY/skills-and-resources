<script setup lang="ts">
import type { MaybeRefOrGetter } from "vue";

const props = defineProps<{
  name: MaybeRefOrGetter<string>;
  description: MaybeRefOrGetter<string>;
}>();
</script>

<template>
  <div class="app-intro-container">
    <div class="app-intro-name text-style-h2">{{ props.name }}</div>
    <div class="app-intro-description text-style-h2-light">{{ props.description }}</div>
    <div class="app-intro-slot"><slot></slot></div>
    <LanguageSelector class="language-selector" :hasDarkBackground="true"></LanguageSelector>
    <TokenScanRequest class="token-scan-request"></TokenScanRequest>
  </div>
</template>

<style scoped>
.app-intro-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.app-intro-container > * {
  position: absolute;
}

.app-intro-name {
  color: var(--color-secondary);
  top: 0;
  left: 0;
  margin-top: -0.643ex;
}

.app-intro-description {
  color: var(--color-secondary);
  top: 0;
  right: 0;
  margin-top: -0.35ex;
}

.app-intro-slot {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.language-selector {
  bottom: 0;
  left: 0;
  margin-bottom: -14px;
  padding-top: 22px;
  border-top: 2px solid var(--color-button);
}

.token-scan-request {
  bottom: 0;
  right: 0;
  margin-bottom: calc(-1 * var(--text-style-overline-descender));
}
</style>
