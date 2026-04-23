// TypeBox schema definitions for config types defined in src/config/config.ts.
// Uses Type.Module() to resolve nested types via Type.Ref() references.
import { Type } from "typebox";

import type { StaticDecode } from "typebox";

// Used for resolving URLs relative to the config file, e.g. for assets.
let configFileUrl = global.window
  ? new URL(global.window.location.href)
  : new URL(process.cwd(), "file:///");

// Temporarily override the config file URL for the duration of a callback.
export function withConfigFileUrl<T>(url: URL, callback: () => T): T {
  const oldUrl = configFileUrl;
  configFileUrl = url;
  const result = callback();
  configFileUrl = oldUrl;
  return result;
}

let assetUrls = new Set<URL>();

export function collectDecodedAssetUrls<T>(callback: () => T): { assetUrls: Set<URL>; result: T } {
  const previousAssetUrls = assetUrls;
  const currentAssetUrls = new Set<URL>();
  assetUrls = currentAssetUrls;
  const result = callback();
  assetUrls = previousAssetUrls;
  return { assetUrls: currentAssetUrls, result };
}

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

    AssetUrl: Type.Decode(
      Type.String({
        title: "Asset URL",
        description: "Relative of absolute URL to an asset.",
      }),
      (value) => {
        const decodedUrl = new URL(value, configFileUrl); // decode relative URLs relative to the current config file
        assetUrls.add(decodedUrl); // gather all asset URLs for later use
        return decodedUrl;
      },
    ),

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
        icon: Type.Ref("AssetUrl", {
          title: "Icon",
          description: "Icon to represent the item on screen.",
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
          description: "Display name of the character.",
        }),
        description: Type.Ref("I18nRecord", {
          title: "Description",
          description: "Background story and personality description of the character.",
        }),
        image: Type.Ref("AssetUrl", {
          title: "Full size character type image",
          description: "URL to the full character type image.",
        }),
        croppedImage: Type.Ref("AssetUrl", {
          title: "Cropped character type image",
          description: "URL to the cropped character type image.",
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
        image: Type.Ref("AssetUrl", {
          title: "Challenge image",
          description: "URL to an image representing the challenge scenario.",
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
            name: Type.Ref("I18nRecord", {
              title: "Name",
              description: "Name to display on the challenge app panel.",
            }),
            title: Type.Ref("I18nRecord", {
              title: "Title",
              description: "Title to display on the challenge app panel.",
            }),
            description: Type.Ref("I18nRecord", {
              title: "Description",
              description: "Introductory text shown in the challenge app panel.",
            }),
            select: Type.Ref("I18nRecord", {
              title: "Select challenge button",
              description: "Text shown on the button to select a challenge.",
            }),
            inventory: Type.Ref("I18nRecord", {
              title: "Inventory",
              description: "Text shown on the inventory panel.",
            }),
            unsolvable: Type.Ref("I18nRecord", {
              title: "Unsolvable",
              description: "Text shown when the challenge is unsolvable for the current character.",
            }),
            success: Type.Ref("I18nRecord", {
              title: "Success",
              description: "Text shown when the player has solved the challenge.",
            }),
            failure: Type.Ref("I18nRecord", {
              title: "Failure",
              description: "Text shown when the player was unable the challenge.",
            }),
            next: Type.Ref("I18nRecord", {
              title: "Next",
              description: "Text shown on the button to advance to the next challenge.",
            }),
            nextHint: Type.Ref("I18nRecord", {
              title: "Next Hint",
              description: "Hint to guide the player to the next challenge.",
            }),
            retryHint: Type.Ref("I18nRecord", {
              title: "Retry Hint",
              description: "Hint to guide the player back to the inventory station.",
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
            intro: Type.Object(
              {
                name: Type.Ref("I18nRecord", {
                  title: "Name",
                  description: "Name to display on the inventory app panel.",
                }),
                title: Type.Ref("I18nRecord", {
                  title: "Title",
                  description: "Title to display on the inventory app panel.",
                }),
                description: Type.Ref("I18nRecord", {
                  title: "Description",
                  description: "Introductory text shown in the inventory app panel.",
                }),
              },
              {
                title: "Intro",
                description: "UI text configuration for the inventory intro.",
                additionalProperties: false,
              },
            ),
            selection: Type.Object(
              {
                title: Type.Ref("I18nRecord", {
                  title: "Title",
                  description: "Title of the selection.",
                }),
                lockedSlots: Type.Ref("I18nRecord", {
                  title: "Locked inventory slots",
                  description: "Label for the locked inventory slots.",
                }),
                slots: Type.Ref("I18nRecord", {
                  title: "Non-locked inventory slots",
                  description: "Label for the non-locked inventory slots.",
                }),
                slotEmpty: Type.Ref("I18nRecord", {
                  title: "Slot Empty",
                  description: "Text shown when a slot is empty.",
                }),
                skills: Type.Ref("I18nRecord", {
                  title: "Skills",
                  description: "Title of the skills section.",
                }),
                resources: Type.Ref("I18nRecord", {
                  title: "Resources",
                  description: "Title of the resources section.",
                }),
                full: Type.Ref("I18nRecord", {
                  title: "Full",
                  description: "Text shown when all inventory slots are full.",
                }),
                fullHint: Type.Ref("I18nRecord", {
                  title: "Full Hint",
                  description: "Hint shown when all inventory slots are full.",
                }),
                continueCondition: Type.Ref("I18nRecord", {
                  title: "Continue Hint Condition",
                  description: "Condition that should be fulfilled moving to the challenge station",
                }),
                continueHint: Type.Ref("I18nRecord", {
                  title: "Continue Hint",
                  description: "Hint shown to guide the player to the challenge station.",
                }),
              },
              {
                title: "Selection",
                description: "UI text configuration for the inventory selection.",
                additionalProperties: false,
              },
            ),
          },
          {
            title: "Inventory",
            description: "UI text configuration for the inventory sub-app.",
            additionalProperties: false,
          },
        ),
        misc: Type.Object(
          {
            character: Type.Ref("I18nRecord", {
              title: "Character",
              description: "The word character in the UI.",
            }),
            challenge: Type.Ref("I18nRecord", {
              title: "Challenge",
              description: "The word challenge in the UI.",
            }),
            invalidItem: Type.Object(
              {
                title: Type.Ref("I18nRecord", {
                  title: "Title",
                  description: "Display title of the item.",
                }),
                description: Type.Ref("I18nRecord", {
                  title: "Description",
                  description: "Longer description explaining the item.",
                }),
              },
              {
                title: "Invalid Item",
                description: "Item to represent invalid item references.",
              },
            ),
            invalidCharacterType: Type.Object(
              {
                title: Type.Ref("I18nRecord", {
                  title: "Title",
                  description: "Display name of the invalid character type.",
                }),
                description: Type.Ref("I18nRecord", {
                  title: "Description",
                  description:
                    "Background story and personality description of the invalid character type.",
                }),
              },
              {
                title: "Invalid character type",
                description: "Character type to represent invalid character type references.",
              },
            ),
          },
          {
            title: "Miscellaneous",
            description: "UI text configuration for miscellaneous elements.",
            additionalProperties: false,
          },
        ),
        tokenScanRequest: Type.Ref("I18nRecord", {
          title: "Token scan request",
          description: "Prompt text asking the player to place their NFC token.",
        }),
        languages: Type.Ref("I18nRecord", {
          title: "Language names",
          description: "The names of the languages as displayed in the language selector.",
        }),
        tokenError: Type.Object(
          {
            name: Type.Ref("I18nRecord", {
              title: "Name",
              description: "Name to display on the token error app panel.",
            }),
            title: Type.Ref("I18nRecord", {
              title: "Title",
              description: "Title to display on the token error app panel.",
            }),
            description: Type.Ref("I18nRecord", {
              title: "Description",
              description: "Generic error description text shown in the token error app panel.",
            }),
            instruction: Type.Ref("I18nRecord", {
              title: "Instruction",
              description: "Instruction text shown in the token error app panel.",
            }),
            supportHint: Type.Ref("I18nRecord", {
              title: "Support hint",
              description: "Instruction text shown in the token error app panel.",
            }),
          },
          {
            title: "Token Error",
            description: "UI text configuration for the token error panel.",
            additionalProperties: false,
          },
        ),
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
export type I18nRecord = StaticDecode<typeof I18nRecordSchema>;

export const AssetUrlSchema = Type.Instantiate(ConfigSchema.$defs, ConfigSchema.$defs.AssetUrl);
export type AssetUrl = StaticDecode<typeof AssetUrlSchema>;

export const ItemTypeSchema = Type.Instantiate(ConfigSchema.$defs, ConfigSchema.$defs.ItemType);
export const ItemTypes = [...ItemTypeSchema.enum.values()];
export type ItemType = StaticDecode<typeof ItemTypeSchema>;

// Item config
export const ItemConfigSchema = Type.Instantiate(ConfigSchema.$defs, ConfigSchema.$defs.ItemConfig);
export type ItemConfig = StaticDecode<typeof ItemConfigSchema>;

// Character type config
export const CharacterTypeConfigSchema = Type.Instantiate(
  ConfigSchema.$defs,
  ConfigSchema.$defs.CharacterTypeConfig,
);
export type CharacterTypeConfig = StaticDecode<typeof CharacterTypeConfigSchema>;

// Challenge item config
export const ChallengeItemConfigSchema = Type.Instantiate(
  ConfigSchema.$defs,
  ConfigSchema.$defs.ChallengeItemConfig,
);
export type ChallengeItemConfig = StaticDecode<typeof ChallengeItemConfigSchema>;

// Challenge config
export const ChallengeConfigSchema = Type.Instantiate(
  ConfigSchema.$defs,
  ConfigSchema.$defs.ChallengeConfig,
);
export type ChallengeConfig = StaticDecode<typeof ChallengeConfigSchema>;

// App config
export const AppConfigSchema = Type.Cyclic(ConfigSchema.$defs, "AppConfig");
export type AppConfig = StaticDecode<typeof AppConfigSchema>;

// Content config
export const ContentConfigSchema = Type.Instantiate(
  ConfigSchema.$defs,
  ConfigSchema.$defs.ContentConfig,
);
export type ContentConfig = StaticDecode<typeof ContentConfigSchema>;

// Top-level config
export type Config = StaticDecode<typeof ConfigSchema>;

export enum Language {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}
