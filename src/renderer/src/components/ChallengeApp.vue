<script setup lang="ts">
import { useTokenState } from "@renderer/composables/token-state";
import { useOptionsStore } from "@renderer/stores/options";

const { options } = useOptionsStore();
const { tokenState } = useTokenState(options.nfc.readers.challenge);
</script>

<template>
  <div class="full-hd-v-box">Challenge Token: {{ tokenState }}</div>
</template>

<style scoped></style>
