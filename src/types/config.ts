// TypeBox schema definitions for config types defined in src/config/config.ts.
// Uses Type.Module() to resolve nested types via Type.Ref() references.
import { Type } from "typebox";

import type { Static } from "typebox";

// ---------------------------------------------------------------------------
// Module definition – all schemas in one place, cross-referenced via Type.Ref
// ---------------------------------------------------------------------------
export const ConfigSchema = Type.Cyclic(
  {
    // Base types
    I18nRecord: Type.Union([Type.String(), Type.Record(Type.String(), Type.String())], {
      title: "I18n Record",
      description:
        "An internationalized text value: either a plain string or a record mapping locale codes to translated strings.",
    }),

    ItemType: Type.Enum(["skill", "resource"], {
      title: "Item Type",
      description: "The category of an inventory item: a personal skill or a physical resource.",
    }),

    // Item config
    ItemConfig: Type.Object(
      {
        id: Type.String({ title: "Item ID", description: "Unique identifier for the item." }),
        type: Type.Ref("ItemType"),
        title: Type.Ref("I18nRecord", {
          title: "Title",
          description: "Display title of the item.",
        }),
        description: Type.Ref("I18nRecord", {
          title: "Description",
          description: "Longer description explaining the item.",
        }),
        icon: Type.String({
          title: "Icon",
          description: "Emoji or icon identifier representing the item.",
        }),
      },
      {
        title: "Item Config",
        description: "Configuration for a single skill or resource item in the inventory.",
        additionalProperties: false,
      },
    ),

    // Character type config
    CharacterTypeConfig: Type.Object(
      {
        id: Type.String({
          title: "Character type ID",
          description: "Unique identifier for the character type.",
        }),
        items: Type.Array(Type.String({ description: "Item ID." }), {
          title: "Items",
          description: "List of item ids that are permanently assigned to this character type.",
        }),
        title: Type.Ref("I18nRecord", {
          title: "Title",
          description: "Display name of the character (including age).",
        }),
        description: Type.Ref("I18nRecord", {
          title: "Description",
          description: "Background story and personality description of the character.",
        }),
        icon: Type.String({
          title: "Icon",
          description: "Emoji or icon identifier representing the character.",
        }),
      },
      {
        title: "Character Type Config",
        description: "Configuration for a character type that players can assume via an NFC token.",
        additionalProperties: false,
      },
    ),

    // Challenge item config
    ChallengeItemConfig: Type.Object(
      {
        id: Type.String({
          title: "Item ID",
          description: "Item ID referencing an item required by this challenge.",
        }),
        present: Type.Ref("I18nRecord", {
          title: "Present Text",
          description: "Feedback text shown when the player has this item.",
        }),
        missing: Type.Ref("I18nRecord", {
          title: "Missing Text",
          description: "Feedback text shown when the player is missing this item.",
        }),
      },
      {
        title: "Challenge Item Config",
        description:
          "Describes how a specific item relates to a challenge, including feedback for presence and absence.",
        additionalProperties: false,
      },
    ),

    // Challenge config
    ChallengeConfig: Type.Object(
      {
        id: Type.String({
          title: "Challenge ID",
          description: "Unique identifier for the challenge.",
        }),
        solution: Type.Object(
          {
            items: Type.Array(Type.Ref("ChallengeItemConfig"), {
              title: "Items",
              description: "Items that form the solution to this challenge.",
            }),
            success: Type.Ref("I18nRecord", {
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
        title: Type.Ref("I18nRecord", {
          title: "Title",
          description: "Display title of the challenge scenario.",
        }),
        description: Type.Ref("I18nRecord", {
          title: "Description",
          description: "Narrative description of the challenge scenario.",
        }),
        icon: Type.String({
          title: "Icon",
          description: "Emoji or icon identifier representing the challenge.",
        }),
      },
      {
        title: "Challenge Config",
        description:
          "Configuration for a challenge scenario that players attempt to solve with their inventory items.",
        additionalProperties: false,
      },
    ),

    // App config
    AppConfig: Type.Object(
      {
        challenge: Type.Object(
          {
            title: Type.Ref("I18nRecord", {
              title: "Title",
              description: "Heading for the challenge app panel.",
            }),
            description: Type.Ref("I18nRecord", {
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
            title: Type.Ref("I18nRecord", {
              title: "Title",
              description: "Heading for the inventory app panel.",
            }),
            description: Type.Ref("I18nRecord", {
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
        tokenPrompt: Type.Ref("I18nRecord", {
          title: "Token Prompt",
          description: "Prompt text asking the player to place their NFC token.",
        }),
      },
      {
        title: "App Config",
        description: "Top-level UI text and labels for the two sub-apps (challenge and inventory).",
        additionalProperties: false,
      },
    ),

    // Content config
    ContentConfig: Type.Object(
      {
        items: Type.Array(Type.Ref("ItemConfig"), {
          title: "Items",
          description: "All available skills and resources.",
        }),
        characterTypes: Type.Array(Type.Ref("CharacterTypeConfig"), {
          title: "Character Types",
          description: "All available character types that can be assigned via NFC tokens.",
        }),
        challenges: Type.Array(Type.Ref("ChallengeConfig"), {
          title: "Challenges",
          description: "All challenge scenarios available in the exhibit.",
        }),
      },
      {
        title: "Content Config",
        description:
          "Content definitions including items, character types, and challenge scenarios.",
        additionalProperties: false,
      },
    ),

    // Top-level config
    Config: Type.Object(
      {
        app: Type.Ref("AppConfig"),
        content: Type.Ref("ContentConfig"),
      },
      {
        title: "Config",
        description: "Root configuration combining app-level UI text and all content definitions.",
        additionalProperties: false,
      },
    ),
  },
  "Config",
);

// ---------------------------------------------------------------------------
// Exported schemas (extracted from the module) and companion static types
// ---------------------------------------------------------------------------

// Base types
export const I18nRecordSchema = Type.Instantiate(ConfigSchema.$defs, ConfigSchema.$defs.I18nRecord);
export type I18nRecord = Static<typeof I18nRecordSchema>;

export const ItemTypeSchema = Type.Instantiate(ConfigSchema.$defs, ConfigSchema.$defs.ItemType);
export type ItemType = Static<typeof ItemTypeSchema>;

// Item config
export const ItemConfigSchema = Type.Instantiate(ConfigSchema.$defs, ConfigSchema.$defs.ItemConfig);
export type ItemConfig = Static<typeof ItemConfigSchema>;

// Character type config
export const CharacterTypeConfigSchema = Type.Instantiate(
  ConfigSchema.$defs,
  ConfigSchema.$defs.CharacterTypeConfig,
);
export type CharacterTypeConfig = Static<typeof CharacterTypeConfigSchema>;

// Challenge item config
export const ChallengeItemConfigSchema = Type.Instantiate(
  ConfigSchema.$defs,
  ConfigSchema.$defs.ChallengeItemConfig,
);
export type ChallengeItemConfig = Static<typeof ChallengeItemConfigSchema>;

// Challenge config
export const ChallengeConfigSchema = Type.Instantiate(
  ConfigSchema.$defs,
  ConfigSchema.$defs.ChallengeConfig,
);
export type ChallengeConfig = Static<typeof ChallengeConfigSchema>;

// App config
export const AppConfigSchema = Type.Instantiate(ConfigSchema.$defs, ConfigSchema.$defs.AppConfig);
export type AppConfig = Static<typeof AppConfigSchema>;

// Content config
export const ContentConfigSchema = Type.Instantiate(
  ConfigSchema.$defs,
  ConfigSchema.$defs.ContentConfig,
);
export type ContentConfig = Static<typeof ContentConfigSchema>;

// Top-level config
export type Config = Static<typeof ConfigSchema>;
