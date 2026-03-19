<script setup lang="ts"></script>

<template>
  <div class="slot-group"><slot></slot></div>
</template>

<style scoped>
.slot-group {
  display: flex;
  flex-direction: row;
  gap: 10px;

  > * {
    width: 157px;
    height: 157px;
    border-radius: 4px;
  }
}
</style>
