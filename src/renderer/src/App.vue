<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useCharacterAssignmentStore } from "@renderer/stores/character-assignment";

const characterAssignmentStore = useCharacterAssignmentStore();
const { challenge, inventory } = storeToRefs(characterAssignmentStore);
</script>

<template>
  <div>Challenge Token: {{ challenge }}</div>
  <div>Inventory Token: {{ inventory }}</div>
</template>

<style scoped></style>
