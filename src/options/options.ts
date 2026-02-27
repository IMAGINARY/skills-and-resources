import type { DeepReadonly } from "vue";

export type MutableOptions = {
  flipSides: boolean;
  languages: {
    primary: string;
    secondary: string;
  };
  websocketTokenReaderUrl: string;
};

export type Options = DeepReadonly<MutableOptions>;

function parseBoolean(s: string | null, defaultValue: boolean): boolean {
  return /^(|[Tt]rue|1)$/i.test((s ?? `${defaultValue}`).trim());
}

export const defaultOptions: Options = {
  flipSides: false,
  languages: {
    primary: "de",
    secondary: "en",
  },
  websocketTokenReaderUrl: "ws://localhost:8382",
};

export async function loadOptions(): Promise<MutableOptions> {
  const sp = new URLSearchParams(window.location.search);

  console.log();
  return {
    flipSides: parseBoolean(sp.get("flipSides"), defaultOptions.flipSides),
    languages: {
      primary: sp.get("fstLang") ?? defaultOptions.languages.primary,
      secondary: sp.get("sndLang") ?? defaultOptions.languages.secondary,
    },
    websocketTokenReaderUrl: sp.get("wsTokenReaderUrl") ?? defaultOptions.websocketTokenReaderUrl,
  };
}
