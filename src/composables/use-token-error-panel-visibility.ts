import { computed, ref } from "vue";
import { watchImmediate } from "@vueuse/core";
import { useOptionsStore } from "@/stores/options.ts";
import { TokenStateType } from "@/types/token.ts";

import type { Ref } from "vue";
import type { TokenStateNFC } from "@/types/token.ts";

export function useTokenErrorPanelVisibility(tokenState: Ref<TokenStateNFC>) {
  const { options } = useOptionsStore();
  const { errorPanelMinDuration } = options;

  const hidden = ref(true);
  let timeout: NodeJS.Timeout | null = null;
  watchImmediate(tokenState, (tokenStateValue) => {
    switch (tokenStateValue.state) {
      case TokenStateType.PRESENT:
        hidden.value = true;
        break;
      case TokenStateType.ERROR:
        hidden.value = false;
        if (timeout !== null) clearTimeout(timeout);
        setTimeout(() => {
          if (tokenState.value.state !== TokenStateType.ERROR) hidden.value = true;
        }, errorPanelMinDuration);
        break;
      default:
        // keep current error panel visibility state
        break;
    }
  });
  return {
    hidden: computed(() => hidden.value),
    visible: computed(() => !hidden.value),
  };
}
