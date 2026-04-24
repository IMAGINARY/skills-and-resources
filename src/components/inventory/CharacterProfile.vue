<script setup lang="ts">
import { computed, toValue, type MaybeRefOrGetter, type DeepReadonly } from "vue";

import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";
import type { CharacterTypeConfig } from "@/types/config.ts";

const props = defineProps<{
  characterType: MaybeRefOrGetter<DeepReadonly<CharacterTypeConfig>>;
}>();

const { app } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();

const characterType = computed(() => toValue(props.characterType));
</script>

<template>
  <div class="character-profile">
    <div>
      <div class="character-profile-overline text-style-overline">
        {{ t(app.inventory.selection.title) }}
      </div>
      <div class="character-profile-title text-style-h2">
        {{ t(app.misc.character) }}: {{ t(characterType.title) }}
      </div>
      <div class="character-profile-description text-style-copy">
        {{ t(characterType.description) }}
      </div>
    </div>
    <img class="character-profile-image" :src="characterType.image.href" />
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
