import type { DeepReadonly } from "vue";

export type MutableOptions = {
  languages: {
    primary: string;
    secondary: string;
  };
  websocketTokenReaderUrl: string;
};

export type Options = DeepReadonly<MutableOptions>;

export const defaultOptions: Options = {
  languages: {
    primary: "de",
    secondary: "en",
  },
  websocketTokenReaderUrl: "ws://localhost:8382",
};

export async function loadOptions(): Promise<MutableOptions> {
  const sp = new URLSearchParams(window.location.search);
  return {
    languages: {
      primary: sp.get("fstLang") ?? defaultOptions.languages.primary,
      secondary: sp.get("sndLang") ?? defaultOptions.languages.secondary,
    },
    websocketTokenReaderUrl: sp.get("wsTokenReaderUrl") ?? defaultOptions.websocketTokenReaderUrl,
  };
}
