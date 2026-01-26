import type { DeepReadonly } from "vue";
import config from "@renderer/config/config.yaml";

// TODO: Create types from schema or vice versa

export type I18nRecord = string | Record<string, string>;

export type ItemType = "skill" | "resource";

export type Item = {
  id: string;
  type: ItemType;
  ui: {
    title: I18nRecord;
    description: I18nRecord;
    icon: string;
  };
};

export type CharacterClass = {
  id: string;
  staticItems: string[];
  ui: {
    title: I18nRecord;
    description: I18nRecord;
    icon: string;
  };
};

export type Challenge = {
  id: string;
  solution: string[];
  ui: {
    title: I18nRecord;
    description: I18nRecord;
    icon: string;
  };
};

export type MutableConfig = {
  apps: {
    challenge: {
      title: I18nRecord;
      description: I18nRecord;
    };
    inventory: {
      title: I18nRecord;
      description: I18nRecord;
    };
  };
  items: Item[];
  characterClasses: CharacterClass[];
  challenges: Challenge[];
};

export type Config = DeepReadonly<MutableConfig>;

export async function loadConfig(): Promise<MutableConfig> {
  // TODO: Load config from file(s) at runtime
  return structuredClone(config as MutableConfig);
}
