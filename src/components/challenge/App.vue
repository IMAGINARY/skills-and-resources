<script setup lang="ts">
import type { DeepReadonly } from "vue";

import { computed, ref } from "vue";
import { watchImmediate } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useConfigStore } from "@/stores/config";
import { useCharacterStore } from "@/stores/characters";
import { useTokenStore } from "@/stores/token";
import { useLanguageStore, provideLanguage } from "@/stores/language";
import AppIntro from "@/components/common/AppIntro.vue";
import ChallengeOverview from "@/components/challenge/ChallengeOverview.vue";
import LanguageSelector from "@/components/common/LanguageSelector.vue";
import TokenErrorPanel from "@/components/common/TokenErrorPanel.vue";
import { TokenStateType } from "@/types/token";
import { Language } from "@/types/config.ts";
import ArrowNextComponent from "@/assets/arrow-next.svg?component";
import { useTokenErrorPanelVisibility } from "@/composables/use-token-error-panel-visibility.ts";

const { app, content } = useConfigStore();
const { characters } = storeToRefs(useCharacterStore());
const { ensureCharacter } = useCharacterStore();

const language = ref<Language>(Language.PRIMARY);
const { useT } = useLanguageStore();
const t = useT(language);
provideLanguage(language); // use this language for all child components

const { challenge: tokenState } = storeToRefs(useTokenStore());

const { hidden: hideTokenErrorPanel } = useTokenErrorPanelVisibility(tokenState);

const activeCharacterId = computed(() =>
  tokenState.value.state === TokenStateType.PRESENT ? tokenState.value.token.id : null,
);

watchImmediate(tokenState, (tokenStateValue) => {
  if (tokenStateValue.state === TokenStateType.PRESENT) {
    const { token } = tokenStateValue;
    ensureCharacter(token.id, token.class);
  }
});

const disableChallengeSelection = computed(() => activeCharacterId.value === null);
const activeChallengeId = ref<string | null>(null);
watchImmediate(disableChallengeSelection, (value) => {
  if (value) activeChallengeId.value = null;
});

const requiredItemIds = computed<DeepReadonly<string[]>>(() => {
  return activeChallengeId.value
    ? (content.challenges
        .find(({ id }) => id === activeChallengeId.value)
        ?.solution?.items?.map(({ id }) => id) ?? [])
    : [];
});

const availableItemIds = computed<DeepReadonly<string[]>>(() => {
  return activeCharacterId.value
    ? (characters.value[activeCharacterId.value]?.inventory
        .map(({ itemId }) => itemId)
        .filter((i) => i !== null) ?? [])
    : [];
});

const challengeSolved = computed<boolean>(() => {
  const requiredItemSet = new Set(requiredItemIds.value);
  const characterItemSet = new Set(availableItemIds.value);
  const remainingItemSet = requiredItemSet.difference(characterItemSet);
  return remainingItemSet.size === 0;
});
</script>

<template>
  <div class="app-position app-size challenge-app">
    <AppIntro
      :name="app.challenge.name"
      :description="app.challenge.title"
      :characterId="activeCharacterId"
      class="app-intro"
      ><div class="app-intro-inner-box">
        <div class="challenge-list">
          <ChallengeOverview
            v-for="(challenge, challengeIndex) in content.challenges"
            :language="language"
            :challenge-id="challenge.id"
            :challenge-idx="challengeIndex"
            :disabled="disableChallengeSelection"
            :key="challenge.id"
            @selected="() => (activeChallengeId = challenge.id)"
          ></ChallengeOverview>
        </div>
        <div class="challenge-list-buttons">
          <button class="disabled"><ArrowNextComponent></ArrowNextComponent></button>
          <button><ArrowNextComponent></ArrowNextComponent></button>
        </div>
        <div class="app-intro-text text-style-h2-station-2">{{ t(app.challenge.description) }}</div>
        <div v-if="activeChallengeId !== null">
          <div>Active challenge: {{ activeChallengeId }}</div>
          <div>Solved: {{ challengeSolved }}</div>
        </div>
        <div>Challenge Token: {{ tokenState }}</div>
      </div>
    </AppIntro>
    <TokenErrorPanel
      :tokenState="tokenState"
      :class="{ 'token-error-panel-hidden': hideTokenErrorPanel }"
    ></TokenErrorPanel>
  </div>
</template>

<style scoped>
.challenge-app {
  position: relative;
}

.app-intro {
  transform: translate(0%, 0%);
  transition: transform 0.5s ease-in-out;
}

.app-intro.app-intro-hidden {
  transform: translate(0%, 100%);
}

.app-intro-inner-box {
  position: absolute;
  top: 549px;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.challenge-list {
  display: flex;
  flex-direction: row;
  overflow: scroll;
  flex-wrap: nowrap;
  column-gap: var(--app-padding);
  width: calc(100% + var(--app-padding) * 2);
  margin-left: calc(-1 * var(--app-padding));
  padding-left: var(--app-padding);
  padding-right: var(--app-padding);
  scrollbar-width: none;
}

.challenge-list-buttons {
  display: flex;
  flex-direction: row;
  column-gap: 224px;
  margin-top: 39px;
}

.challenge-list-buttons button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--color-button);
}

.challenge-list-buttons button:first-child {
  transform: scaleX(-1);
}

.challenge-list-buttons button svg {
  fill: var(--color-white) !important;
}

.challenge-list-buttons button.disabled {
  background-color: var(--color-button-inactive);
}

.challenge-list-buttons button.disabled svg {
  fill: var(--color-buttontext-inactive) !important;
}

.app-intro-text {
  position: absolute;
  top: calc(-76px + var(--text-style-h2-station-2-descender));
  transform: translate(0px, -100%);
  color: var(--color-secondary);
}

.token-error-panel {
  transform: translate(0%, 0%);
  transition: transform 0.5s ease-in-out;
}

.token-error-panel.token-error-panel-hidden {
  transform: translate(0%, 100%);
}
</style>
