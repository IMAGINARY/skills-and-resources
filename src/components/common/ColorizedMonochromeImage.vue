<script setup lang="ts">
import { type MaybeRefOrGetter, type DeepReadonly, toValue } from "vue";

// TODO: Accent color is not displayed correctly
// TODO: White parts of the icons are gone

const props = defineProps<{
  url: MaybeRefOrGetter<DeepReadonly<URL>>;
}>();
</script>

<template>
  <div
    class="outer mask"
    :style="{
      'mask-image': `url(&quot;${toValue(props.url).href}&quot;)`,
    }"
  >
    <img :src="toValue(url).href" class="inner" />
  </div>
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
