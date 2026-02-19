import { type I18nRecord, Language } from "@/types/config";
import type { MaybeRefOrGetter } from "vue";
import { computed, provide, inject, toValue } from "vue";
import { defineStore } from "pinia";

import { LANGUGAGE_INJECTION_KEY } from "@/constants";
import { useOptionsStore } from "./options";

function translate(i18nRecord: I18nRecord, languageCode: string) {
  if (typeof i18nRecord === "string") return i18nRecord;
  if (typeof i18nRecord[languageCode] === "string") return i18nRecord[languageCode];
  return "<undefined>";
}

export function injectLanguage() {
  return inject<MaybeRefOrGetter<Language>>(
    LANGUGAGE_INJECTION_KEY,
    () => {
      console.warn("No language provided. Using static default.");
      return Language.PRIMARY;
    },
    true,
  );
}

export function provideLanguage(language: MaybeRefOrGetter<Language>) {
  return provide(LANGUGAGE_INJECTION_KEY, language);
}

export const useLanguageStore = defineStore("language", () => {
  const { options } = useOptionsStore();

  const languages: Record<Language, string> = options.languages;
  const t = (i18nRecord: MaybeRefOrGetter<I18nRecord>, lang: MaybeRefOrGetter<Language>) =>
    computed(() => translate(toValue(i18nRecord), languages[toValue(lang)]));

  const useT =
    (language: MaybeRefOrGetter = injectLanguage()) =>
    (i18nRecord: I18nRecord) =>
      t(i18nRecord, language);

  return {
    t,
    useT, // create a new translation function using the injected language
  };
});
