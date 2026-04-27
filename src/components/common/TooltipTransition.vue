<script setup lang="ts"></script>

<template>
  <Transition name="tooltip" mode="out-in"><slot></slot></Transition>
</template>

<style>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.25s;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
