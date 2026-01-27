<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useConfigStore } from "@renderer/stores/config";
import ItemThumbnail from "@renderer/components/ItemThumbnail.vue";
import { useCharacterStore } from "@renderer/stores/characters";

const props = defineProps<{
  characterId: string;
}>();

const { characterTypes, t1st, t2nd } = useConfigStore();
const { characters } = storeToRefs(useCharacterStore());

const type = computed(() => {
  return characters.value[props.characterId]
    ? characterTypes[characters.value[props.characterId].type]
    : null;
});
</script>

<template>
  <template v-if="characters[characterId]">
    <div v-if="type">
      <div>{{ type.ui.icon }}</div>
      <div>ID: {{ props.characterId }} Class: {{ characters[characterId].type }}</div>
      <div>{{ t1st(type.ui.title) }}</div>
      <div>{{ t2nd(type.ui.title) }}</div>
      <div>{{ t1st(type.ui.description) }}</div>
      <div>{{ t2nd(type.ui.description) }}</div>
      <div>
        <template v-for="slot in characters[characterId].inventory">
          <ItemThumbnail
            v-if="slot.item !== null"
            :item-id="slot.item"
            :key="slot.item"
          ></ItemThumbnail>
        </template>
      </div>
    </div>
    <div v-else>Unknown character type: {{ characters[characterId].type }}</div>
  </template>
  <div v-else>Unknown character</div>
</template>

<style scoped></style>
