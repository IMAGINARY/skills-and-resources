<script setup lang="ts">
import { useTokenState } from "@renderer/composables/token-state";
import { useOptionsStore } from "@renderer/stores/options";

const { options } = useOptionsStore();
const { tokenState } = useTokenState(options.nfc.readerNames.inventory);
</script>

<template>
  <div class="full-hd-v-box">Inventory Token: {{ tokenState }}</div>
</template>

<style scoped></style>
