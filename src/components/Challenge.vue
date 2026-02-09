<script setup lang="ts">
import { computed } from "vue";

import { useConfigStore } from "@/stores/config";
import ItemThumbnail from "@/components/ItemThumbnail.vue";

const props = defineProps<{
  challengeId: string;
}>();

const { challenges, t1st, t2nd } = useConfigStore();

const challenge = computed(() => challenges[props.challengeId]);
</script>

<template>
  <div v-if="challenge" class="text-4xl">
    <div class="text-[4em]">{{ challenge.ui.icon }}</div>
    <div>{{ t1st(challenge.ui.title) }}</div>
    <div>{{ t2nd(challenge.ui.title) }}</div>
    <div>{{ t1st(challenge.ui.description) }}</div>
    <div>{{ t2nd(challenge.ui.description) }}</div>
    <div class="text-[2em]">
      <ItemThumbnail
        v-for="{ id: itemId } in challenge.solution"
        :item-id="itemId"
        :key="itemId"
      ></ItemThumbnail>
    </div>
  </div>
  <div v-else>Unknown challenge</div>
</template>

<style scoped></style>
