<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { useTokenState } from "@renderer/composables/token-state";
import { useOptionsStore } from "@renderer/stores/options";
import { useConfigStore } from "@renderer/stores/config";
import { useCharacterStore } from "@renderer/stores/characters";
import Item from "@renderer/components/Item.vue";
import Character from "@renderer/components/Character.vue";
import { TokenStateType } from "@renderer/token-reader/token-reader";

const { options } = useOptionsStore();
const { config, t1st, t2nd } = useConfigStore();
const { ensureCharacter } = useCharacterStore();

const { tokenState } = useTokenState(options.nfc.readers.inventory);

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

const highlightedItemId = ref<string | null>(null);
</script>

<template>
  <div class="full-hd-v-box inventory-app">
    <div class="text-4xl">
      <h1>{{ t1st(config.apps.inventory.title) }}</h1>
      <h2>{{ t2nd(config.apps.inventory.title) }}</h2>
    </div>
    <div class="slideover-container">
      <div>
        <Character v-if="activeCharacterId" :character-id="activeCharacterId"></Character>
      </div>
      <div class="item-list p-4 gap-4">
        <Item
          v-for="item in config.items"
          :item-id="item.id"
          :key="item.id"
          :is-static="true"
          :highlight="highlightedItemId === item.id"
          @click="highlightedItemId = item.id"
        ></Item>
      </div>
      <USlideover
        v-model:open="slideoverOpen"
        :portal="false"
        :overlay="true"
        :close="false"
        :dismissible="false"
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
          <p class="text-8xl">{{ t1st(config.apps.tokenPrompt) }}</p>
          <p class="text-6xl mt-8">{{ t2nd(config.apps.tokenPrompt) }}</p>
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

.item-list {
  display: flex;
  flex-direction: row;
  overflow: scroll;
  flex-wrap: nowrap;
  scroll-behavior: smooth;
}
</style>
