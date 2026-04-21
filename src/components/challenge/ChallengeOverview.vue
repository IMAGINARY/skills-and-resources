<script setup lang="ts">
import { computed } from "vue";

import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";
import { useTap } from "@/composables/use-tap.ts";

const props = defineProps<{
  challengeId: string;
  challengeIdx: number;
  disabled: boolean;
}>();

const emit = defineEmits<{ selected: [challengeId: string, challengeIdx: number] }>();

const { app, challenges } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();

const challenge = computed(() => challenges[props.challengeId]);
</script>

<template>
  <div class="challenge-container">
    <template v-if="challenge">
      <img :src="challenge.image.href" class="challenge-image" />
      <div class="challenge-label-box-outer">
        <div class="challenge-label-box-inner">
          <div class="challenge-label-with-idx text-style-overline">
            {{ t(app.misc.challenge) }} {{ props.challengeIdx + 1 }}
          </div>
          <div class="challenge-title text-style-h2">{{ t(challenge.title) }}</div>
          <div class="challenge-description text-style-copy">{{ t(challenge.description) }}</div>
        </div>
        <button
          class="text-style-overline"
          :class="{ disabled: disabled }"
          v-drag="
            useTap(() => (disabled ? undefined : $emit('selected', challengeId, challengeIdx)))
          "
        >
          {{ t(app.challenge.select) }}
        </button>
      </div>
    </template>
    <template v-else>Unknown challenge</template>
  </div>
</template>

<style scoped>
.challenge-container {
  display: flex;
  flex-direction: column;
  min-width: 720px;
  max-width: 720px;
  min-height: 900px;
  max-height: 900px;
  background-color: var(--color-white);
  border-radius: 32px 32px;
  overflow: hidden;
}

.challenge-image {
  min-height: 520px;
  max-height: 520px;
  background-color: var(--color-backdrop-light);
  display: flex;
  align-items: center;
  justify-content: center;
  object-fit: cover;
}

.challenge-label-box-outer {
  flex-grow: 2;
  color: var(--color-primary);
  padding: 9px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.challenge-label-box-outer > button {
  width: 100%;
  height: 60px;
  color: var(--color-white);
  background-color: var(--color-button);
  border-radius: 30px;
  border-width: 0;
}

.challenge-label-box-outer > button.disabled {
  color: var(--color-buttontext-inactive);
  background-color: var(--color-button-inactive);
}

.challenge-label-box-inner {
  flex: 1 1 0;
  padding: 11px 21px 0px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.challenge-label-box-inner > * {
  flex: 0 0 auto;
  overflow: hidden;
}

.challenge-label-with-idx,
.challenge-title {
  white-space: nowrap;
}

.challenge-title {
  margin-top: 8px;
  margin-bottom: 15px;
}

.challenge-description {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
