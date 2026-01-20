<script setup lang="ts">
import { useTokenState } from "@renderer/composables/token-state";
import { useOptionsStore } from "@renderer/stores/options";

const optionStore = useOptionsStore();
const { options } = optionStore;
const { tokenState: challenge } = useTokenState(options.nfc.readerNames.challenge);
const { tokenState: inventory } = useTokenState(options.nfc.readerNames.inventory);
</script>

<template>
  <div>Challenge Token: {{ challenge }}</div>
  <div>Inventory Token: {{ inventory }}</div>
</template>

<style scoped></style>
