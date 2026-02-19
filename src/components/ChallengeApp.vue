<script setup lang="ts">
import type { DeepReadonly } from "vue";

import { computed, watch, ref } from "vue";
import { storeToRefs } from "pinia";
import { useConfigStore } from "@/stores/config";
import { useCharacterStore } from "@/stores/characters";
import { useTokenStore } from "@/stores/token";
import { useLanguageStore, provideLanguage } from "@/stores/language";
import Character from "@/components/Character.vue";
import { TokenStateType } from "@/types/token";
import Challenge from "@/components/Challenge.vue";
import { useTap } from "@/composables/use-tap";
import { Language } from "@/types/config.ts";

const { app, content } = useConfigStore();
const { characters } = storeToRefs(useCharacterStore());
const { ensureCharacter } = useCharacterStore();

const language = ref<Language>(Language.PRIMARY);
const { useT } = useLanguageStore();
const t = useT(language);
provideLanguage(language); // use this language for all child components

const { challenge: tokenState } = storeToRefs(useTokenStore());

const activeCharacterId = computed(() =>
  tokenState.value.state === TokenStateType.PRESENT ? tokenState.value.token.id : null,
);

watch(tokenState, () => {
  if (tokenState.value.state === TokenStateType.PRESENT) {
    const { token } = tokenState.value;
    ensureCharacter(token.id, token.class);
  }
});

const activeChallengeId = ref<string | null>(null);

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
  <div class="full-hd-v-box challenge-app">
    <LanguageSelector></LanguageSelector>
    <div>
      <h1>{{ t(app.challenge.title) }}</h1>
    </div>
    <div class="challenge-list">
      <Challenge
        v-for="challenge in content.challenges"
        :language="language"
        :challenge-id="challenge.id"
        :key="challenge.id"
        v-drag="useTap(() => (activeChallengeId = challenge.id))"
      ></Challenge>
    </div>
    <div v-if="activeChallengeId !== null">
      <div>Active challenge: {{ activeChallengeId }}</div>
      <div>Solved: {{ challengeSolved }}</div>
    </div>
    <div>Challenge Token: {{ tokenState }}</div>
    <Character
      v-if="activeCharacterId"
      :language="language"
      :character-id="activeCharacterId"
    ></Character>
  </div>
</template>

<style scoped>
.challenge-app {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
}

.challenge-list {
  display: flex;
  flex-direction: row;
  overflow: scroll;
  flex-wrap: nowrap;
  column-gap: 1rem;
}
</style>
