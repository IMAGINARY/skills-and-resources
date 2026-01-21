import type { DeepReadonly } from "vue";
import config from "@renderer/config/config.yaml";

// TODO: Create types from schema or vice versa

export type I18nRecord = string | Record<string, string>;

export type Property = {
  id: string;
  ui: {
    title: I18nRecord;
    description: I18nRecord;
    icon: I18nRecord;
  };
};

export type ItemType = "skill" | "resource";

export type Item = {
  id: string;
  type: ItemType;
  providedProperties: string[];
  ui: {
    title: I18nRecord;
    description: I18nRecord;
    icon: I18nRecord;
  };
};

export type Character = {
  id: string;
  staticItems: string[];
  ui: {
    title: I18nRecord;
    description: I18nRecord;
    icon: I18nRecord;
  };
};

export type Challenge = {
  id: string;
  requiredProperties: string[];
  ui: {
    title: I18nRecord;
    description: I18nRecord;
    icon: I18nRecord;
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
  properties: Property[];
  items: Item[];
  characters: Character[];
  challenges: Challenge[];
};

export type Config = DeepReadonly<MutableConfig>;

export async function loadConfig(): Promise<MutableConfig> {
  // TODO: Load config from file(s) at runtime
  return structuredClone(config as MutableConfig);
}
