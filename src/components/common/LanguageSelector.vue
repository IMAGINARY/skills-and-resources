<script setup lang="ts">
import { type MaybeRefOrGetter } from "vue";
import { useConfigStore } from "@/stores/config";
import { useLanguageStore, injectLanguage } from "@/stores/language";
import { Language } from "@/types/config.ts";
import { useTap } from "@/composables/use-tap.ts";

// needed to cope with Spaghetti design that uses different styles
// depending on the background color ... :-/
const props = defineProps<{ hasDarkBackground: MaybeRefOrGetter<boolean> }>();

const { app } = useConfigStore();
const { t } = useLanguageStore();

const language = injectLanguage();

function updateLanguage(newLanguage: Language) {
  language.value = newLanguage;
}

function toggleLanguage() {
  language.value = language.value === Language.PRIMARY ? Language.SECONDARY : Language.PRIMARY;
}
</script>

<template>
  <span class="text-style-language-switcher language-switcher-container"
    ><span
      class="language-label"
      :class="{
        active: language === Language.PRIMARY,
        'dark-bg': props.hasDarkBackground,
      }"
      v-drag="useTap(() => updateLanguage(Language.PRIMARY))"
      >{{ t(app.languages, Language.PRIMARY) }}</span
    ><label class="switch" @click.prevent v-drag="useTap(toggleLanguage)">
      <input
        type="checkbox"
        v-model="language"
        :true-value="Language.SECONDARY"
        :false-value="Language.PRIMARY"
        @click.prevent /><span class="slider round" @click.prevent></span></label
    ><span
      class="language-label"
      :class="{
        active: language === Language.SECONDARY,
        'dark-bg': props.hasDarkBackground,
      }"
      v-drag="useTap(() => updateLanguage(Language.SECONDARY))"
      >{{ t(app.languages, Language.SECONDARY) }}</span
    >
  </span>
</template>

<style scoped>
.language-switcher-container {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 13px;
}

.language-switcher-container *,
.language-switcher-container *:before {
  transition: 0.4s;
}

.language-label,
.switch {
  cursor: pointer;
}

.language-label {
  color: var(--color-backdrop-dark);
  opacity: 0.22;
}

.language-label.dark-bg {
  color: white;
  opacity: 0.36;
}

.language-label.active {
  color: var(--color-button);
  opacity: 1;
}

.switch {
  position: relative;
  display: inline-block;
  width: 95px;
  height: 45px;
}

.switch > input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-button);
}

.slider:before {
  position: absolute;
  content: "";
  height: 35px;
  width: 35px;
  left: 5px;
  bottom: 5px;
  background-color: white;
}

input:checked + .slider:before {
  transform: translateX(calc(95px - 35px - 2 * 5px));
}

/* Round the corners of the toggle container and the toggle */
.slider.round,
.slider.round:before {
  border-radius: 50vh;
}
</style>
