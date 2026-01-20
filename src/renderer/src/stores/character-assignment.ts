import { ref } from "vue";
import { defineStore } from "pinia";

import { useOptionsStore } from "@renderer/stores/options";
import { TokenReaderNFC } from "@renderer/token-reader/token-reader-nfc";

import type { TokenStateNFC } from "@renderer/token-reader/token-reader-nfc";

export const useCharacterAssignmentStore = defineStore("character-assignment", () => {
  const optionStore = useOptionsStore();

  const { challengeNfcReaderName, inventoryNfcReaderName } = optionStore.config;

  const challengeReaderNfc = new TokenReaderNFC(challengeNfcReaderName);
  const challenge = ref<TokenStateNFC>(challengeReaderNfc.currentToken);
  challengeReaderNfc.on("update", () => (challenge.value = challengeReaderNfc.currentToken));

  const inventoryReaderNfc = new TokenReaderNFC(inventoryNfcReaderName);
  const inventory = ref<TokenStateNFC>(inventoryReaderNfc.currentToken);
  inventoryReaderNfc.on("update", () => (inventory.value = inventoryReaderNfc.currentToken));

  return { challenge, inventory };
});
