<script setup lang="ts">
import { type DeepReadonly, type MaybeRefOrGetter, toValue } from "vue";
import { type ItemConfig } from "@/types/config";
import { useLanguageStore } from "@/stores/language";
import TooltipTransition from "@/components/common/TooltipTransition.vue";
import ColorizedMonochromeImage from "@/components/common/ColorizedMonochromeImage.vue";
import { useTap } from "@/composables/use-tap.ts";
import { useTooltip } from "@/composables/use-tooltip.ts";

const props = defineProps<{
  item: MaybeRefOrGetter<DeepReadonly<ItemConfig>>;
  tooltip?: MaybeRefOrGetter<string>;
}>();

const { useT } = useLanguageStore();
const t = useT();

const { showTooltip, toggleTooltip } = useTooltip();
</script>

<template>
  <div class="slotted-item" v-drag="useTap(toggleTooltip)">
    <TooltipTransition>
      <div v-if="tooltip && showTooltip" class="tooltip text-style-card">
        <div class="white-space-pre-line">{{ tooltip }}</div>
      </div>
      <div v-else>
        <div class="thumbnail">
          <div><ColorizedMonochromeImage :url="toValue(item).icon"></ColorizedMonochromeImage></div>
        </div>
        <div class="title text-style-copy">{{ t(toValue(item).title) }}</div>
      </div>
    </TooltipTransition>
  </div>
</template>

<style scoped>
.slotted-item {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--background-color, white);
  color: var(--label-color, black);
}

.tooltip {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 8px;
}

.thumbnail {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 15px 15px 30px 15px;
  display: flex;
  justify-content: center;

  > div {
    height: 100%;
    aspect-ratio: 1;
  }
}

.title {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
}
</style>
