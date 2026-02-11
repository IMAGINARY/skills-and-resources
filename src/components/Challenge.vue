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
    <div class="text-[4em]">{{ challenge.icon }}</div>
    <div>{{ t1st(challenge.title) }}</div>
    <div>{{ t2nd(challenge.title) }}</div>
    <div>{{ t1st(challenge.description) }}</div>
    <div>{{ t2nd(challenge.description) }}</div>
    <div class="text-[2em]">
      <ItemThumbnail
        v-for="{ id: itemId } in challenge.solution.items"
        :item-id="itemId"
        :key="itemId"
      ></ItemThumbnail>
    </div>
  </div>
  <div v-else>Unknown challenge</div>
</template>

<style scoped></style>
