import type { DeepReadonly } from "vue";

export type MutableOptions = {
  flipSides: boolean;
  languages: {
    primary: string;
    secondary: string;
  };
  websocketTokenReaderUrl: string;
  errorPanelMinDuration: number;
  appCfg: string;
  contentCfg: string;
  sentryDsn: string | undefined;
};

export type Options = DeepReadonly<MutableOptions>;

function parseBoolean(s: string | null, defaultValue: boolean): boolean {
  return /^(|[Tt]rue|1)$/i.test((s ?? `${defaultValue}`).trim());
}

function parseInteger(s: string | null, defaultValue: number): number {
  return s === null ? defaultValue : parseInt(s);
}

export const defaultOptions: Options = {
  flipSides: false,
  languages: {
    primary: "de",
    secondary: "en",
  },
  websocketTokenReaderUrl: "ws://localhost:8382",
  errorPanelMinDuration: 20000,
  appCfg: "app.yaml",
  contentCfg: "content.yaml",
  sentryDsn: undefined,
};

export async function loadOptions(): Promise<MutableOptions> {
  const sp = new URLSearchParams(window.location.search);

  return {
    flipSides: parseBoolean(sp.get("flipSides"), defaultOptions.flipSides),
    languages: {
      primary: sp.get("fstLang") ?? defaultOptions.languages.primary,
      secondary: sp.get("sndLang") ?? defaultOptions.languages.secondary,
    },
    websocketTokenReaderUrl: sp.get("wsTokenReaderUrl") ?? defaultOptions.websocketTokenReaderUrl,
    errorPanelMinDuration: parseInteger(
      sp.get("errorPanelMinDuration"),
      defaultOptions.errorPanelMinDuration,
    ),
    appCfg: sp.get("appCfg") ?? defaultOptions.appCfg,
    contentCfg: sp.get("contentCfg") ?? defaultOptions.contentCfg,
    sentryDsn: sp.get("sentryDsn") ?? defaultOptions.sentryDsn,
  };
}
