<script setup lang="ts">
import { useConfigStore } from "@/stores/config";
import { useLanguageStore, injectLanguage } from "@/stores/language";
import { Language } from "@/types/config.ts";

const { app} = useConfigStore();
const { t } = useLanguageStore();

const language = injectLanguage();
</script>

<template>
  <div><span>{{t(app.languages,Language.PRIMARY)}}</span><input
    type="checkbox"
    v-model="language"
    :true-value="Language.SECONDARY"
    :false-value="Language.PRIMARY"
  ></input><span>{{t(app.languages,Language.SECONDARY)}}</span></div>
</template>

<style scoped></style>
