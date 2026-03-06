<script setup lang="ts">
import { ref, computed, watch } from "vue";

import { useTokenStore } from "@/stores/token";
import { useConfigStore } from "@/stores/config";
import { useCharacterStore } from "@/stores/characters";
import { useLanguageStore, provideLanguage } from "@/stores/language";
import Item from "@/components/common/Item.vue";
import Character from "@/components/common/Character.vue";
import { TokenStateType } from "@/types/token";
import { Language } from "@/types/config.ts";
import { useTap } from "@/composables/use-tap";
import { storeToRefs } from "pinia";

const { app, content } = useConfigStore();
const { ensureCharacter, toggleItem, hasItem, isItemLocked } = useCharacterStore();

const language = ref<Language>(Language.PRIMARY);
const { useT } = useLanguageStore();
const t = useT(language);
provideLanguage(language); // use this language for all child components

const { inventory: tokenState } = storeToRefs(useTokenStore());

const activeCharacterId = ref<string | null>(null);
watch(tokenState, () => {
  if (tokenState.value.state === TokenStateType.PRESENT) {
    // Only update when a new token is present but not when it is removed.
    // This ensures that the inventory is still visible during animation of the app intro.
    activeCharacterId.value = tokenState.value.token.id;

    // Make sure a character for the token UID exists
    const { token } = tokenState.value;
    ensureCharacter(token.id, token.class);
  }
});

const hideAppIntro = computed(() => tokenState.value.state === TokenStateType.PRESENT);
</script>

<template>
  <div class="full-hd-v-box inventory-app">
    <div v-if="activeCharacterId" class="character-inventory app-padding">
      <Character :language="language" :character-id="activeCharacterId"></Character>
      <div class="item-list p-4 gap-4">
        <Item
          v-for="item in content.items"
          :item-id="item.id"
          :key="item.id"
          :language="language"
          :is-static="true"
          :highlight="activeCharacterId ? hasItem(activeCharacterId, item.id) : false"
          :locked="activeCharacterId ? isItemLocked(activeCharacterId, item.id) : false"
          v-drag="useTap(toggleItem.bind(undefined, activeCharacterId, item.id))"
        ></Item>
      </div>
    </div>
    <AppIntro
      :name="t(app.inventory.name)"
      :description="t(app.inventory.title)"
      class="app-intro app-padding"
      :class="{ 'app-intro-hidden': hideAppIntro }"
      ><div class="app-intro-text text-style-h1">
        <div>{{ t(app.inventory.description) }}</div>
      </div>
    </AppIntro>
  </div>
</template>

<style scoped>
.inventory-app {
  position: relative;
}

.app-padding {
  border-width: var(--app-padding);
  border-color: transparent; /* Using border over padding helps with applying temporary coloring as layout guide */
}

.app-intro {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: translate(0%, 0%);
  transition: transform 0.5s ease-in-out;
  background-color: var(--color-backdrop-dark);
}

.app-intro.app-intro-hidden {
  transform: translate(0%, 100%);
}

.app-intro-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  height: 100%;
  color: var(--color-secondary);
}

.character-inventory {
  position: absolute;
  top: 100px;
  left: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-list {
  display: flex;
  flex-direction: row;
  overflow: scroll;
  flex-wrap: nowrap;
  scroll-behavior: smooth;
}
</style>
