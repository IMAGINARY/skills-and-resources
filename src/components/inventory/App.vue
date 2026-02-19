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

const activeCharacterId = computed(() =>
  tokenState.value.state === TokenStateType.PRESENT ? tokenState.value.token.id : null,
);

watch(tokenState, () => {
  if (tokenState.value.state === TokenStateType.PRESENT) {
    const { token } = tokenState.value;
    ensureCharacter(token.id, token.class);
  }
});

const slideoverOpen = computed(() => tokenState.value.state !== TokenStateType.PRESENT);
</script>

<template>
  <div class="full-hd-v-box inventory-app">
    <LanguageSelector v-model="language"></LanguageSelector>
    <div class="text-4xl">
      <h1>{{ t(app.inventory.title) }}</h1>
    </div>
    <div class="slideover-container">
      <div v-if="activeCharacterId" class="character-inventory">
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
      <USlideover
        v-model:open="slideoverOpen"
        :portal="false"
        :overlay="true"
        :close="false"
        :dismissible="false"
        :modal="false"
        side="bottom"
        :ui="{
          overlay: 'absolute inset-0',
          body: 'flex-1 flex flex-col items-center justify-center',
          footer: 'justify-center',
          content:
            'absolute inset-0 data-[state=open]:animate-[slide-in-from-bottom_400ms_ease-in-out] data-[state=closed]:animate-[slide-out-to-bottom_400ms_ease-in-out]',
        }"
      >
        <template #body>
          <div class="flex-2"></div>
          <p class="text-8xl">{{ t(app.tokenPrompt) }}</p>
          <div class="flex-1"></div>
          <div class="text-center text-3xl">Inventory Token:<br />{{ tokenState }}</div>
          <div class="flex-1"></div>
        </template>
        <template #footer>
          <UIcon name="i-lucide-arrow-down" class="size-100" />
        </template>
      </USlideover>
    </div>
  </div>
</template>

<style scoped>
.inventory-app {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
}

.slideover-container {
  position: relative;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.character-inventory {
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
