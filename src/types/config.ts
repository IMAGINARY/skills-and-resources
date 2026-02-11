// TypeBox schema definitions for config types defined in src/config/config.ts.
import { Type } from "typebox";

import type { Static } from "typebox";

// Base types
export const I18nRecordSchema = Type.Union(
  [Type.String(), Type.Record(Type.String(), Type.String())],
  {
    $id: "I18nRecord",
    title: "I18n Record",
    description:
      "An internationalized text value: either a plain string or a record mapping locale codes to translated strings.",
  },
);
export type I18nRecord = Static<typeof I18nRecordSchema>;

const ItemTypeSkillSchema = Type.Literal("skill");
const ItemTypeResourceSchema = Type.Literal("resource");
export const ItemTypeSchema = Type.Union([ItemTypeSkillSchema, ItemTypeResourceSchema], {
  $id: "ItemType",
  title: "Item Type",
  description: "The category of an inventory item: a personal skill or a physical resource.",
});
export type ItemType = Static<typeof ItemTypeSchema>;
export const ItemType = {
  SKILL: ItemTypeSkillSchema.const,
  RESOURCE: ItemTypeResourceSchema.const,
} as const;

// Item config
export const ItemConfigSchema = Type.Object(
  {
    id: Type.String({ title: "ID", description: "Unique identifier for the item." }),
    type: ItemTypeSchema,
    title: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
      title: "Title",
      description: "Display title of the item.",
    }),
    description: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
      title: "Description",
      description: "Longer description explaining the item.",
    }),
    icon: Type.String({
      title: "Icon",
      description: "Emoji or icon identifier representing the item.",
    }),
  },
  {
    $id: "ItemConfig",
    title: "Item Config",
    description: "Configuration for a single skill or resource item in the inventory.",
    additionalProperties: false,
  },
);
export type ItemConfig = Static<typeof ItemConfigSchema>;

// Character type config
export const CharacterTypeConfigSchema = Type.Object(
  {
    id: Type.String({
      title: "ID",
      description: "Unique identifier for the character type.",
    }),
    staticItems: Type.Array(Type.String({ description: "Item id." }), {
      title: "Static Items",
      description: "List of item ids that are permanently assigned to this character type.",
    }),
    title: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
      title: "Title",
      description: "Display name of the character (including age).",
    }),
    description: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
      title: "Description",
      description: "Background story and personality description of the character.",
    }),
    icon: Type.String({
      title: "Icon",
      description: "Emoji or icon identifier representing the character.",
    }),
  },
  {
    $id: "CharacterTypeConfig",
    title: "Character Type Config",
    description: "Configuration for a character type that players can assume via an NFC token.",
    additionalProperties: false,
  },
);
export type CharacterTypeConfig = Static<typeof CharacterTypeConfigSchema>;

// Challenge item config
export const ChallengeItemConfigSchema = Type.Object(
  {
    id: Type.String({
      title: "ID",
      description: "Item id referencing an item required by this challenge.",
    }),
    present: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
      title: "Present Text",
      description: "Feedback text shown when the player has this item.",
    }),
    missing: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
      title: "Missing Text",
      description: "Feedback text shown when the player is missing this item.",
    }),
  },
  {
    $id: "ChallengeItemConfig",
    title: "Challenge Item Config",
    description:
      "Describes how a specific item relates to a challenge, including feedback for presence and absence.",
    additionalProperties: false,
  },
);
export type ChallengeItemConfig = Static<typeof ChallengeItemConfigSchema>;

// Challenge config
export const ChallengeConfigSchema = Type.Object(
  {
    id: Type.String({
      title: "ID",
      description: "Unique identifier for the challenge.",
    }),
    solution: Type.Object(
      {
        items: Type.Array(ChallengeItemConfigSchema, {
          title: "Items",
          description: "Items that form the solution to this challenge.",
        }),
        success: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
          title: "Success Message",
          description: "Message displayed when the player has all required items.",
        }),
      },
      {
        title: "Solution",
        description:
          "The expected solution for the challenge, consisting of required items and a success message.",
        additionalProperties: false,
      },
    ),
    title: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
      title: "Title",
      description: "Display title of the challenge scenario.",
    }),
    description: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
      title: "Description",
      description: "Narrative description of the challenge scenario.",
    }),
    icon: Type.String({
      title: "Icon",
      description: "Emoji or icon identifier representing the challenge.",
    }),
  },
  {
    $id: "ChallengeConfig",
    title: "Challenge Config",
    description:
      "Configuration for a challenge scenario that players attempt to solve with their inventory items.",
    additionalProperties: false,
  },
);
export type ChallengeConfig = Static<typeof ChallengeConfigSchema>;

// App config
export const AppConfigSchema = Type.Object(
  {
    challenge: Type.Object(
      {
        title: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
          title: "Title",
          description: "Heading for the challenge app panel.",
        }),
        description: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
          title: "Description",
          description: "Introductory text shown in the challenge app panel.",
        }),
      },
      {
        title: "Challenge",
        description: "UI text configuration for the challenge sub-app.",
        additionalProperties: false,
      },
    ),
    inventory: Type.Object(
      {
        title: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
          title: "Title",
          description: "Heading for the inventory app panel.",
        }),
        description: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
          title: "Description",
          description: "Introductory text shown in the inventory app panel.",
        }),
      },
      {
        title: "Inventory",
        description: "UI text configuration for the inventory sub-app.",
        additionalProperties: false,
      },
    ),
    tokenPrompt: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
      title: "Token Prompt",
      description: "Prompt text asking the player to place their NFC token.",
    }),
  },
  {
    $id: "AppConfig",
    title: "App Config",
    description: "Top-level UI text and labels for the two sub-apps (challenge and inventory).",
    additionalProperties: false,
  },
);
export type AppConfig = Static<typeof AppConfigSchema>;

// Content config
export const ContentConfigSchema = Type.Object(
  {
    items: Type.Array(ItemConfigSchema, {
      title: "Items",
      description: "All available skills and resources.",
    }),
    characterTypes: Type.Array(CharacterTypeConfigSchema, {
      title: "Character Types",
      description: "All available character types that can be assigned via NFC tokens.",
    }),
    challenges: Type.Array(ChallengeConfigSchema, {
      title: "Challenges",
      description: "All challenge scenarios available in the exhibit.",
    }),
  },
  {
    $id: "ContentConfig",
    title: "Content Config",
    description: "Content definitions including items, character types, and challenge scenarios.",
    additionalProperties: false,
  },
);
export type ContentConfig = Static<typeof ContentConfigSchema>;

// Top-level config
export const ConfigSchema = Type.Object(
  {
    app: AppConfigSchema,
    content: ContentConfigSchema,
  },
  {
    $id: "Config",
    title: "Config",
    description: "Root configuration combining app-level UI text and all content definitions.",
    additionalProperties: false,
  },
);
export type Config = Static<typeof ConfigSchema>;
