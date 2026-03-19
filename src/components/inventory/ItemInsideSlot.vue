<script setup lang="ts">
import { type DeepReadonly, type MaybeRefOrGetter, toValue } from "vue";
import { type ItemConfig } from "@/types/config";
import { useLanguageStore } from "@/stores/language";
import ColorizedMonochromeImage from "@/components/common/ColorizedMonochromeImage.vue";

const props = defineProps<{
  item: MaybeRefOrGetter<DeepReadonly<ItemConfig>>;
}>();

const { useT } = useLanguageStore();
const t = useT();
</script>

<template>
  <div class="slotted-item">
    <div class="thumbnail">
      <div><ColorizedMonochromeImage :url="toValue(item).icon"></ColorizedMonochromeImage></div>
    </div>
    <div class="title text-style-copy">{{ t(toValue(item).title) }}</div>
  </div>
</template>

<style scoped>
.slotted-item {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--background-color, white);
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
  color: var(--label-color, black);
}
</style>
