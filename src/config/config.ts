import type { DeepReadonly } from "vue";
import app from "@/config/app.yaml";
import content from "@/config/content.yaml";

// TODO: Create types from schema or vice versa

export type I18nRecord = string | Record<string, string>;

export type ItemType = "skill" | "resource";

export type Item = {
  id: string;
  type: ItemType;
  title: I18nRecord;
  description: I18nRecord;
  icon: string;
};

export type CharacterType = {
  id: string;
  staticItems: string[];
  title: I18nRecord;
  description: I18nRecord;
  icon: string;
};

export type ChallengeItem = {
  id: string;
  present: I18nRecord;
  missing: I18nRecord;
};

export type Challenge = {
  id: string;
  solution: {
    items: ChallengeItem[];
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
  items: Item[];
  characterTypes: CharacterType[];
  challenges: Challenge[];
};

export type MutableConfig = {
  app: AppConfig;
  content: ContentConfig;
};

export type Config = DeepReadonly<MutableConfig>;

export async function loadConfig(): Promise<MutableConfig> {
  // TODO: Load config from file(s) at runtime
  return structuredClone({
    app: app as AppConfig,
    content: content as ContentConfig,
  } as MutableConfig);
}
