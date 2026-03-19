<script setup lang="ts">
import { ref } from "vue";
import { watchImmediate } from "@vueuse/core";
import { type TokenStateNFC, TokenStateType } from "@/types/token.ts";
import { useTap } from "@/composables/use-tap.ts";
import { useConfigStore } from "@/stores/config.ts";
import { useLanguageStore } from "@/stores/language.ts";
import LanguageSelector from "@/components/common/LanguageSelector.vue";
import tokenSvgUrl from "@/assets/token.svg?url";

const props = defineProps<{ tokenState: TokenStateNFC }>();

const { app } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();

const showErrorMessage = ref(false);
const lastError = ref<string>("No Error yet.");
watchImmediate(
  () => props.tokenState,
  (tokenState) => {
    if (tokenState.state === TokenStateType.ERROR) {
      lastError.value = JSON.stringify(tokenState.error, undefined, 2);
      showErrorMessage.value = false;
    }
  },
);
</script>

<template>
  <div class="app-page token-error-panel">
    <div class="token-error-panel-name text-style-h2">{{ t(app.tokenError.name) }}</div>
    <div class="token-error-panel-description text-style-h2-light">
      {{ t(app.tokenError.title) }}
    </div>
    <div class="token-box">
      <img
        class="token"
        :src="tokenSvgUrl"
        alt="token"
        v-drag="useTap(() => (showErrorMessage = !showErrorMessage))"
      />
    </div>
    <div
      class="error-box"
      :class="{
        hidden: !showErrorMessage,
      }"
    >
      <div>{{ lastError }}</div>
    </div>
    <div class="content-box">
      <div class="content-box-title text-style-h1-station-2">
        {{ t(app.tokenError.description) }}
      </div>
      <div class="content-box-description text-style-h2">
        <div>{{ t(app.tokenError.instruction) }}</div>
        <div>{{ t(app.tokenError.supportHint) }}</div>
      </div>
    </div>
    <div class="language-selector">
      <LanguageSelector :hasDarkBackground="true"></LanguageSelector>
    </div>
  </div>
</template>

<style scoped>
.token-error-panel {
  background-color: var(--color-secondary);
  background-image: linear-gradient(to right, var(--color-primary), var(--color-primary));
  background-size: calc(100% + 2 * var(--app-padding)) 141px;
  background-repeat: no-repeat;
  background-position: calc(-1 * var(--app-padding)) calc(100% + var(--app-padding));
}

.token-error-panel > * {
  position: absolute;
}

.token-error-panel-name {
  color: var(--color-backdrop-dark);
  top: 0;
  left: 0;
  margin-top: -0.643ex;
}

.token-error-panel-description {
  color: var(--color-backdrop-dark);
  top: 0;
  right: 0;
  margin-top: -0.35ex;
}

.token-box {
  top: 389px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.token {
  height: 402px;
}

.error-box {
  top: calc(389px + 402px);
  height: calc(921px - (389px + 402px));
  width: 100%;
  padding: var(--app-padding) 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hidden {
  display: none;
}

.content-box {
  top: 921px;
}

.content-box-title {
  color: var(--color-white);
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
  margin-bottom: 74px;
}

.content-box-description {
  color: var(--color-backdrop-dark);
}

.language-selector {
  position: absolute;
  bottom: 0;
  margin-bottom: -14px;
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>
