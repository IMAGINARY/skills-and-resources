<script setup lang="ts">
import type { Challenge as ChallengeConfig } from "@renderer/config/config";
import type { DeepReadonly } from "vue";

import { computed, watch, ref } from "vue";
import { storeToRefs } from "pinia";
import { useTokenState } from "@renderer/composables/token-state";
import { useOptionsStore } from "@renderer/stores/options";
import { useConfigStore } from "@renderer/stores/config";
import { useCharacterStore } from "@renderer/stores/characters";
import Character from "@renderer/components/Character.vue";
import { TokenStateType } from "@renderer/token-reader/token-reader";
import Challenge from "@renderer/components/Challenge.vue";

const { options } = useOptionsStore();
const { config, t1st, t2nd } = useConfigStore();
const { characters } = storeToRefs(useCharacterStore());
const { updateType, getItems } = useCharacterStore();

const { tokenState } = useTokenState(options.nfc.readers.challenge);

const activeCharacter = computed(() => {
  if (tokenState.value.state !== TokenStateType.PRESENT) return false;

  const presentToken = tokenState.value.token;
  return characters.value.find(({ id }) => id === presentToken.id) ?? false;
});

watch(tokenState, () => {
  if (tokenState.value.state === TokenStateType.PRESENT) {
    const { token } = tokenState.value;
    updateType(token.id, token.class);
  }
});

const activeChallenge = ref<DeepReadonly<ChallengeConfig> | false>(false);

const challengeSolved = computed<boolean>(() => {
  if (!activeChallenge.value || !activeCharacter.value) return false;

  const requiredItemSet = new Set(activeChallenge.value.solution);
  const characterItemSet = new Set(getItems(activeCharacter.value.id));
  const remainingItemSet = requiredItemSet.difference(characterItemSet);
  return remainingItemSet.size === 0;
});
</script>

<template>
  <div class="full-hd-v-box challenge-app">
    <div>
      <h1>{{ t1st(config.apps.challenge.title) }}</h1>
      <h2>{{ t2nd(config.apps.challenge.title) }}</h2>
    </div>
    <div class="challenge-list">
      <Challenge
        v-for="challenge in config.challenges"
        :challenge="challenge"
        :key="challenge.id"
        @click="activeChallenge = challenge"
      ></Challenge>
    </div>
    <div v-if="activeChallenge !== false">
      <div>Active challenge: {{ activeChallenge.id }}</div>
      <div>Solved: {{ challengeSolved }}</div>
    </div>
    <div>Challenge Token: {{ tokenState }}</div>
    <Character
      v-if="activeCharacter"
      :character="activeCharacter"
      :key="activeCharacter.id"
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
