import { Type } from "typebox";

import type { Static } from "typebox";

// Base types
export const I18nRecordSchema = Type.Union(
  [Type.String(), Type.Record(Type.String(), Type.String())],
  { $id: "I18nRecord" },
);
export type I18nRecord = Static<typeof I18nRecordSchema>;

const ItemTypeSkillSchema = Type.Literal("skill");
const ItemTypeResourceSchema = Type.Literal("resource");
export const ItemTypeSchema = Type.Union([ItemTypeSkillSchema, ItemTypeResourceSchema], {
  $id: "ItemType",
});
export type ItemType = Static<typeof ItemTypeSchema>;
export const ItemType = {
  SKILL: ItemTypeSkillSchema.const,
  RESOURCE: ItemTypeResourceSchema.const,
} as const;

// Item config
export const ItemConfigSchema = Type.Object(
  {
    id: Type.String(),
    type: ItemTypeSchema,
    title: I18nRecordSchema,
    description: I18nRecordSchema,
    icon: Type.String(),
  },
  { $id: "ItemConfig" },
);
export type ItemConfig = Static<typeof ItemConfigSchema>;

// Character type config
export const CharacterTypeConfigSchema = Type.Object(
  {
    id: Type.String(),
    staticItems: Type.Array(Type.String()),
    title: I18nRecordSchema,
    description: I18nRecordSchema,
    icon: Type.String(),
  },
  { $id: "CharacterTypeConfig" },
);
export type CharacterTypeConfig = Static<typeof CharacterTypeConfigSchema>;

// Challenge item config
export const ChallengeItemConfigSchema = Type.Object(
  {
    id: Type.String(),
    present: I18nRecordSchema,
    missing: I18nRecordSchema,
  },
  { $id: "ChallengeItemConfig" },
);
export type ChallengeItemConfig = Static<typeof ChallengeItemConfigSchema>;

// Challenge config
export const ChallengeConfigSchema = Type.Object(
  {
    id: Type.String(),
    solution: Type.Object({
      items: Type.Array(ChallengeItemConfigSchema),
      success: I18nRecordSchema,
    }),
    title: I18nRecordSchema,
    description: I18nRecordSchema,
    icon: Type.String(),
  },
  { $id: "ChallengeConfig" },
);
export type ChallengeConfig = Static<typeof ChallengeConfigSchema>;

// App config
export const AppConfigSchema = Type.Object(
  {
    challenge: Type.Object({
      title: I18nRecordSchema,
      description: I18nRecordSchema,
    }),
    inventory: Type.Object({
      title: I18nRecordSchema,
      description: I18nRecordSchema,
    }),
    tokenPrompt: I18nRecordSchema,
  },
  { $id: "AppConfig" },
);
export type AppConfig = Static<typeof AppConfigSchema>;

// Content config
export const ContentConfigSchema = Type.Object(
  {
    items: Type.Array(ItemConfigSchema),
    characterTypes: Type.Array(CharacterTypeConfigSchema),
    challenges: Type.Array(ChallengeConfigSchema),
  },
  { $id: "ContentConfig" },
);
export type ContentConfig = Static<typeof ContentConfigSchema>;

// Top-level config
export const ConfigSchema = Type.Object(
  {
    app: AppConfigSchema,
    content: ContentConfigSchema,
  },
  { $id: "Config" },
);
export type Config = Static<typeof ConfigSchema>;
