import type { DeepReadonly } from "vue";
import app from "@/config/app.yaml";
import content from "@/config/content.yaml";
import { ConfigSchema } from "@/types/config.ts";
import { Value } from "typebox/value";

import type { Config } from "@/types/config";

export async function loadConfig(): Promise<DeepReadonly<Config>> {
  const config = { app, content };
  if (!Value.Check(ConfigSchema, config)) {
    // Collect detailed errors
    console.error("Config validation failed:", ...Value.Errors(ConfigSchema, config));
    throw new Error("Config validation failed");
  }
  return Value.Clone(config);
}
