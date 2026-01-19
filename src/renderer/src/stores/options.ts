import { computed } from "vue";
import { defineStore } from "pinia";

export type Options = {
  challengeNfcReaderName: string;
  inventoryNfcReaderName: string;
};

export type ReadonlyOptions = Readonly<Options>;

const options: ReadonlyOptions = {
  challengeNfcReaderName: "ACS ACR122U PICC Interface",
  inventoryNfcReaderName: "ACS ACR122U PICC Interface 01",
};

export const useOptionsStore = defineStore("options", () => {
  const config = computed(() => options);

  return { config };
});
