import type { DeepReadonly } from "vue";
import app from "@/config/app.yaml";
import content from "@/config/content.yaml";

import type { AppConfig, ContentConfig, Config } from "@/types/config";

export async function loadConfig(): Promise<DeepReadonly<Config>> {
  // TODO: Load config from file(s) at runtime
  return structuredClone({
    app: app as AppConfig,
    content: content as ContentConfig,
  } as Config);
}
