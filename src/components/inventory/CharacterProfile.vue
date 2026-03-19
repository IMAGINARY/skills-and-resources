<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";

import { useConfigStore } from "@/stores/config";
import { useCharacterStore } from "@/stores/characters";
import { useLanguageStore } from "@/stores/language";

const props = defineProps<{
  characterId: string;
}>();

const { app, characterTypes } = useConfigStore();
const { characters } = storeToRefs(useCharacterStore());
const { useT } = useLanguageStore();
const t = useT();

const character = computed(() => characters.value[props.characterId] ?? null);

const type = computed(() => {
  const char = character.value;
  return char ? characterTypes[char.type] : null;
});
</script>

<template>
  <div class="character-profile">
    <template v-if="character">
      <template v-if="type">
        <div class="text">
          <div class="character-profile-overline text-style-overline">
            {{ t(app.inventory.selection.title) }}
          </div>
          <div class="character-profile-title text-style-h2">
            {{ t(app.misc.character) }}: {{ t(type.title) }}
          </div>
          <div class="character-profile-description text-style-copy">{{ t(type.description) }}</div>
        </div>
        <img class="image" :src="type.image.href" />
      </template>
      <template v-else> Unknown character type: {{ character.type }}</template>
    </template>
    <template v-else> Unknown character: {{ characterId }} </template>
  </div>
</template>

<style scoped>
.character-profile {
  position: relative;
  border-style: solid;
  border-width: var(--app-padding) 0 0 var(--app-padding);
  border-color: var(--padding-color);
  width: 100%;
  height: 660px;
  display: flex;
  flex-direction: row;
  align-content: stretch;
}

.character-profile-text {
  color: var(--color-backdrop-light);
}

.character-profile-overline {
  margin-top: calc(199px - var(--app-padding));
}

.character-profile-title {
  margin-top: 8px;
}

.character-profile-description {
  margin-top: 15px;
}

.character-profile-image {
  height: 100%;
}
</style>
