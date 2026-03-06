<script setup lang="ts">
import { computed, toValue } from "vue";
import { type MaybeRefOrGetter } from "vue";
import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";
import { useCharacterStore } from "@/stores/characters";
import type { CharacterTypeConfig, I18nRecord } from "@/types/config.ts";
import { storeToRefs } from "pinia";

const props = defineProps<{
  name: MaybeRefOrGetter<I18nRecord>;
  description: MaybeRefOrGetter<I18nRecord>;
  characterId?: MaybeRefOrGetter<string | null>;
}>();

const { useT } = useLanguageStore();
const t = useT();

const { app, characterTypes } = useConfigStore();
const { characters } = storeToRefs(useCharacterStore());

const character = computed(() => {
  if (typeof props.characterId === "undefined" || props.characterId === null) return null;

  const characterIdValue = toValue(props.characterId);
  if (characterIdValue === null) return null;

  return characters.value[characterIdValue] ?? null;
});

const characterTypeConfig = computed(() => {
  if (character === null) return null;

  const char = character.value;
  if (char === null) return null;

  return characterTypes[char.type] ?? null;
});
</script>

<template>
  <div class="app-intro-container">
    <div class="app-intro-name text-style-h2">{{ t(toValue(props.name)) }}</div>
    <div class="app-intro-description text-style-h2-light">{{ t(toValue(props.description)) }}</div>
    <div class="app-intro-slot"><slot></slot></div>
    <LanguageSelector class="language-selector" :hasDarkBackground="true"></LanguageSelector>
    <template v-if="characterTypeConfig !== null">
      <div class="character">
        <div class="character-icon">{{ characterTypeConfig.icon }}</div>
        <div class="character-text-group">
          <div class="character-label text-style-overline">{{ t(app.misc.character) }}</div>
          <div class="character-title text-style-h2">{{ t(characterTypeConfig.title) }}</div>
        </div>
      </div>
    </template>
    <template v-else>
      <TokenScanRequest class="token-scan-request"></TokenScanRequest>
    </template>
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

.character {
  bottom: 0;
  right: 0;
  margin-bottom: -21px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 28px;
}

.character-text-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.character-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 115px;
  height: 115px;
  border-radius: 50%;
  background-color: var(--color-button);
  font-size: 70px;
  overflow: hidden;
}

.character-label {
  color: var(--color-white);
}

.character-title {
  color: var(--color-white);
}

.token-scan-request {
  bottom: 0;
  right: 0;
  margin-bottom: calc(-1 * var(--text-style-overline-descender));
}
</style>
