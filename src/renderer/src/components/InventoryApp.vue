<script setup lang="ts">
import { computed, watch } from "vue";
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
</script>

<template>
  <div class="full-hd-v-box inventory-app">
    <div>
      <h1>{{ t1st(config.apps.inventory.title) }}</h1>
      <h2>{{ t2nd(config.apps.inventory.title) }}</h2>
    </div>
    <div class="item-list">
      <Item v-for="item in config.items" :item-id="item.id" :key="item.id" :is-static="true"></Item>
    </div>
    <div>Inventory Token: {{ tokenState }}</div>
    <Character v-if="activeCharacterId" :character-id="activeCharacterId"></Character>
  </div>
</template>

<style scoped>
.inventory-app {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
}

.item-list {
  display: flex;
  flex-direction: row;
  overflow: scroll;
  flex-wrap: nowrap;
  column-gap: 1rem;
}
</style>
