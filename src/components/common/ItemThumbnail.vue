<script setup lang="ts">
import { useConfigStore } from "@/stores/config";
import { computed } from "vue";

const { items } = useConfigStore();

const props = defineProps<{
  itemId: string;
}>();

const item = computed(() => items[props.itemId]);
</script>

<template>
  <template v-if="item"
    ><div
      class="outer mask"
      :style="{
        'mask-image': `url(${item.icon.href})`,
      }"
    >
      <img :src="item.icon.href" class="inner" /></div
  ></template>
  <template v-else><div class="outer">❓</div></template>
</template>

<style scoped>
.outer {
  position: relative;
  display: inline-block;
  line-height: 0;
  width: inherit;
  height: inherit;
  aspect-ratio: 1 / 1;
}

.outer.mask {
  background-color: var(--accent-color, black);
  mask-image: none; /* override via dynamic style attribute */
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-mode: alpha;
  mask-position: top left;
}

.inner {
  position: relative;
  width: 100%; /* Füllt die Breite des Containers */
  height: 100%; /* Füllt die Höhe des Containers */
  display: inline-block;
  object-fit: contain;
  object-position: top left;
  mix-blend-mode: screen;
}
</style>
