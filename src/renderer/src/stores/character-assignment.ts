import { ref } from "vue";
import { defineStore } from "pinia";

import { useOptionsStore } from "@renderer/stores/options";
import { TokenReaderNFC } from "@renderer/token-reader/token-reader-nfc";

import type { Token } from "@renderer/token-reader/token-reader";

export const useCharacterAssignmentStore = defineStore("character-assignment", () => {
  const challenge = ref<Token | null>(null);
  const inventory = ref<Token | null>(null);

  const optionStore = useOptionsStore();

  const { challengeNfcReaderName, inventoryNfcReaderName } = optionStore.config;

  const challengeReaderNfc = new TokenReaderNFC(challengeNfcReaderName);
  challengeReaderNfc.on("update", () => (challenge.value = challengeReaderNfc.currentToken));

  const inventoryReaderNfc = new TokenReaderNFC(inventoryNfcReaderName);
  inventoryReaderNfc.on("update", () => (inventory.value = inventoryReaderNfc.currentToken));

  return { challenge, inventory };
});
