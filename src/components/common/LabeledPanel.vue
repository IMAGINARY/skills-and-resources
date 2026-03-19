<script setup lang="ts">
import { type MaybeRefOrGetter, toValue } from "vue";

const props = defineProps<{
  label: MaybeRefOrGetter<string>;
}>();
</script>

<template>
  <div class="panel">
    <div class="label text-style-h4">
      <div class="icon"></div>
      {{ toValue(props.label) }}
    </div>
    <div class="content"><slot></slot></div>
  </div>
</template>

<style scoped>
.panel {
  position: relative;
  border-radius: 8px 16px 16px 16px;
  border-width: 2px;
  border-style: solid;
  border-color: var(--border-color);
  background-color: var(--background-color);
  padding: 36px 9px 9px 9px;

  .label {
    display: inline-flex;
    padding: 9px 30px 9px 9px;
    align-items: center;
    gap: 9px;
    position: absolute;
    transform: translate(0%, calc(1px - 36px - 50%));
    border-radius: 7px;
    overflow: hidden;
    color: var(--label-color);
    background-color: var(--label-background-color);
    white-space: nowrap;

    .icon {
      width: 31px;
      height: 31px;
      background: var(--color-white);
      border-radius: 50%;
      mask-size: contain;
      mask-mode: luminance;
      mask-image: var(--label-image);
    }
  }
}
</style>
