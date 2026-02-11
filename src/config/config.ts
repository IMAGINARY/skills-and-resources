import type { DeepReadonly } from "vue";
import app from "@/config/app.yaml";
import content from "@/config/content.yaml";

// TODO: Create types from schema or vice versa

export type I18nRecord = string | Record<string, string>;

export type ItemType = "skill" | "resource";

export type ItemConfig = {
  id: string;
  type: ItemType;
  title: I18nRecord;
  description: I18nRecord;
  icon: string;
};

export type CharacterTypeConfig = {
  id: string;
  staticItems: string[];
  title: I18nRecord;
  description: I18nRecord;
  icon: string;
};

export type ChallengeItemConfig = {
  id: string;
  present: I18nRecord;
  missing: I18nRecord;
};

export type ChallengeConfig = {
  id: string;
  solution: {
    items: ChallengeItemConfig[];
    success: I18nRecord;
  };
  title: I18nRecord;
  description: I18nRecord;
  icon: string;
};

export type AppConfig = {
  challenge: {
    title: I18nRecord;
    description: I18nRecord;
  };
  inventory: {
    title: I18nRecord;
    description: I18nRecord;
  };
  tokenPrompt: I18nRecord;
};

export type ContentConfig = {
  items: ItemConfig[];
  characterTypes: CharacterTypeConfig[];
  challenges: ChallengeConfig[];
};

export type Config = {
  app: AppConfig;
  content: ContentConfig;
};

export async function loadConfig(): Promise<DeepReadonly<Config>> {
  // TODO: Load config from file(s) at runtime
  return structuredClone({
    app: app as AppConfig,
    content: content as ContentConfig,
  } as Config);
}
