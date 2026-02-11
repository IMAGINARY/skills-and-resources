import type { DeepReadonly } from "vue";
import app from "@/config/app.yaml";
import content from "@/config/content.yaml";
import { AppConfigSchema, ContentConfigSchema } from "@/types/config.ts";
import { Value } from "typebox/value";

import type { Config } from "@/types/config";

export async function loadConfig(): Promise<DeepReadonly<Config>> {
  try {
    const config: Config = {
      app: Value.Parse(AppConfigSchema, app),
      content: Value.Parse(ContentConfigSchema, content),
    };
    return structuredClone(config);
  } catch (parseError) {
    console.log("Failed to parse configuration", parseError);
    throw parseError;
  }
}
