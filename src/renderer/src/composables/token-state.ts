import { ref, onMounted, onUnmounted } from "vue";
import { TokenReaderNFC, TokenStateNFC } from "@renderer/token-reader/token-reader-nfc";

import type { Ref } from "vue";

export function useTokenState(nfcReaderRegExp: RegExp): { tokenState: Ref<TokenStateNFC> } {
  const nfcTokenReader = new TokenReaderNFC(nfcReaderRegExp);
  const tokenState = ref<TokenStateNFC>(nfcTokenReader.currentToken);

  const callback = () => {
    tokenState.value = nfcTokenReader.currentToken;
  };

  onMounted(() => nfcTokenReader.on("update", callback));
  onUnmounted(() => nfcTokenReader.off("update", callback));

  return { tokenState };
}
