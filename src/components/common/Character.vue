<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useTap } from "@/composables/use-tap";

import { useConfigStore } from "@/stores/config";
import ItemThumbnail from "@/components/common/ItemThumbnail.vue";
import { useCharacterStore } from "@/stores/characters";
import { useLanguageStore } from "@/stores/language";
import { Language } from "@/types/config.ts";

const props = defineProps<{
  language: Language;
  characterId: string;
}>();

const { characterTypes } = useConfigStore();
const { characters } = storeToRefs(useCharacterStore());
const { toggleItem } = useCharacterStore();
const { useT } = useLanguageStore();
const t = useT();

const character = computed(() => characters.value[props.characterId] ?? null);

const type = computed(() => {
  const char = character.value;
  return char ? characterTypes[char.type] : null;
});
</script>

<template>
  <template v-if="character">
    <div v-if="type">
      <div>{{ type.icon }}</div>
      <div>ID: {{ props.characterId }} Class: {{ character.type }}</div>
      <div>{{ t(type.title, language) }}</div>
      <div>{{ t(type.description, language) }}</div>
      <div>
        <template v-for="{ locked, itemId } in character.inventory" :key="itemId">
          <span class="relative text-8xl">
            <ItemThumbnail :item-id="itemId"></ItemThumbnail>
            <span v-if="locked" class="absolute bottom-0 right-0 text-[0.5em]">🔒</span>
            <span
              v-else
              class="absolute top-0 right-0 text-[0.5em]"
              v-drag="useTap(toggleItem.bind(undefined, characterId, itemId))"
              >❌</span
            >
          </span>
        </template>
      </div>
    </div>
    <div v-else>Unknown character type: {{ character.type }}</div>
  </template>
  <div v-else>Unknown character</div>
</template>

<style scoped></style>
