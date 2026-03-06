<script setup lang="ts">
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";
import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";

import bouncingDownArrowUrl from "@/assets/bouncing-down-arrow.lottie?url";
import tokenSvgUrl from "@/assets/token.svg?url";
import { Language } from "@/types/config.ts";

const { app } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();
const tPrimary = useT(Language.PRIMARY);
const tSecondary = useT(Language.SECONDARY);
</script>

<template>
  <div class="token-scan-request">
    <DotLottieVue class="arrow" autoplay loop :src="bouncingDownArrowUrl" />
    <img class="token" :src="tokenSvgUrl" alt="token" />
    <div class="label text-style-overline white-space-pre-line">
      <span class="placeholder">{{ tPrimary(app.tokenScanRequest) }}</span
      ><span class="placeholder">{{ tSecondary(app.tokenScanRequest) }}</span
      ><span>{{ t(app.tokenScanRequest) }}</span>
    </div>
  </div>
</template>

<style scoped>
.token-scan-request {
  display: flex;
  flex-direction: row;
  align-items: last baseline;
}

.arrow {
  position: relative;
  height: 110px;
  margin-right: -70px;
  bottom: -40px;
}

.token {
  position: relative;
  height: 93px;
  margin-right: 32px;
  bottom: -1px;
}

.label {
  color: var(--color-white);
  display: grid;
}

.label > * {
  grid-area: 1 / 1;
}

.placeholder {
  visibility: hidden;
}
</style>
