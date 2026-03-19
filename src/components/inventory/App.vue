<script setup lang="ts">
import { ref, computed, watch } from "vue";

import { useTokenStore } from "@/stores/token";
import { useConfigStore } from "@/stores/config";
import { useCharacterStore } from "@/stores/characters";
import { useLanguageStore, provideLanguage } from "@/stores/language";
import AppIntro from "@/components/common/AppIntro.vue";
import Item from "@/components/common/Item.vue";
import LanguageSelector from "@/components/common/LanguageSelector.vue";
import TokenErrorPanel from "@/components/common/TokenErrorPanel.vue";
import CharacterProfile from "@/components/inventory/CharacterProfile.vue";
import { TokenStateType } from "@/types/token";
import { Language } from "@/types/config.ts";
import { useTap } from "@/composables/use-tap";
import { storeToRefs } from "pinia";
import { useTokenErrorPanelVisibility } from "@/composables/use-token-error-panel-visibility.ts";

const { app, content } = useConfigStore();
const { ensureCharacter, toggleItem, hasItem, isItemLocked } = useCharacterStore();

const language = ref<Language>(Language.PRIMARY);
const { useT } = useLanguageStore();
const t = useT(language);
provideLanguage(language); // use this language for all child components

const { inventory: tokenState } = storeToRefs(useTokenStore());

const { hidden: hideTokenErrorPanel } = useTokenErrorPanelVisibility(tokenState);

const activeCharacterId = computed(() =>
  tokenState.value.state === TokenStateType.PRESENT ? tokenState.value.token.id : null,
);
const lastActiveCharacterId = ref<string | null>(null);
watch(tokenState, () => {
  if (tokenState.value.state === TokenStateType.PRESENT) {
    // TODO: Move this somewhere else, maybe the character store?
    // Make sure a character for the token UID exists
    const { token } = tokenState.value;
    ensureCharacter(token.id, token.class);

    // Only update when a new token is present but not when it is removed.
    // This ensures that the inventory is still visible during animation of the app intro.
    lastActiveCharacterId.value = tokenState.value.token.id;
  }
});

const hideAppIntro = computed(() => tokenState.value.state === TokenStateType.PRESENT);
</script>

<template>
  <div class="full-hd-v-box inventory-app">
    <div v-if="lastActiveCharacterId" class="character-with-inventory">
      <CharacterProfile :character-id="lastActiveCharacterId"></CharacterProfile>
      <div class="inventory">
        <div class="inventory-slots"></div>
        <div class="available-items"></div>
      </div>
      <div class="language-selector">
        <LanguageSelector :hasDarkBackground="false"></LanguageSelector>
      </div>
    </div>
    <AppIntro
      :name="app.inventory.intro.name"
      :description="app.inventory.intro.title"
      class="app-intro app-padding"
      :class="{ 'app-intro-hidden': hideAppIntro }"
      ><div class="app-intro-text text-style-h1">
        <div>{{ t(app.inventory.intro.description) }}</div>
      </div>
    </AppIntro>
    <TokenErrorPanel
      :tokenState="tokenState"
      :class="{ 'token-error-panel-hidden': hideTokenErrorPanel }"
    ></TokenErrorPanel>
  </div>
</template>

<style scoped>
.inventory-app {
  position: relative;
  background-color: var(--color-backdrop-dark);
  --padding-color: transparent;
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
  top: -0.5ex;
  height: 100%;
  color: var(--color-secondary);
}

.character-with-inventory {
  position: relative;
  width: 100%;
  height: 100%;
}

.language-selector {
  position: absolute;
  bottom: var(--app-padding);
  margin-bottom: -14px;
  display: flex;
  justify-content: center;
  width: 100%;
}

.inventory {
  border-width: 0 var(--app-padding) var(--app-padding) var(--app-padding);
  border-color: var(--padding-color);
  width: 100%;
  height: calc(100% - 660px);
  background-color: var(--color-backdrop-light);
}

.token-error-panel {
  transform: translate(0%, 0%);
  transition: transform 0.5s ease-in-out;
}

.token-error-panel.token-error-panel-hidden {
  transform: translate(0%, 100%);
}
</style>
