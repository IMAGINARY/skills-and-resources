import type { DeepReadonly } from "vue";
import app from "@/config/app.yaml";
import content from "@/config/content.yaml";
import { ConfigSchema } from "@/types/config.ts";
import { Value } from "typebox/value";

import type { Config } from "@/types/config";

function findDuplicates<T>(a: T[]): T[] {
  const seen = new Set<T>();
  const duplicates: T[] = [];
  a.forEach((e) => (seen.has(e) ? duplicates.push(e) : seen.add(e)));
  return duplicates;
}

function checkForDuplicateIds<T extends { id: string }>(
  a: T[],
  errCallback: (duplicates: string[]) => void,
): void {
  const ids = a.map(({ id }) => id);
  const duplicateIds = findDuplicates(ids);
  if (duplicateIds.length > 0) errCallback(duplicateIds);
}

function checkIfAllForeignIdsExist<T extends { id: string }>(
  ids: string[],
  target: T[],
  errCallback: (missingIds: string[]) => void,
): void {
  const targetIds = target.map(({ id }) => id);
  const missingIds = ids.filter((id) => !targetIds.includes(id));
  if (missingIds.length > 0) errCallback(missingIds);
}

export async function loadConfig(): Promise<DeepReadonly<Config>> {
  const config = { app, content };

  const configValidationFailedText = "Config validation failed";
  const configValidationFailedError = new Error(configValidationFailedText);

  // Validate config structure against the JSON Schema
  if (!Value.Check(ConfigSchema, config)) {
    // Collect detailed errors
    console.error(`${configValidationFailedText}:`, ...Value.Errors(ConfigSchema, config));
    throw configValidationFailedError;
  }

  const createIdErrorCallback =
    (msg: string): ((ids: string[]) => void) =>
    (ids: string[]) => {
      console.error(`${configValidationFailedText}: ${msg}`, ...ids);
      throw configValidationFailedError;
    };

  {
    // Check for duplicate item, character type and challenge IDs
    checkForDuplicateIds(config.content.items, createIdErrorCallback("Duplicate Item ID(s)"));
    checkForDuplicateIds(
      config.content.characterTypes,
      createIdErrorCallback("Duplicate Character Type ID(s)"),
    );
    checkForDuplicateIds(
      config.content.challenges,
      createIdErrorCallback("Duplicate Challenge ID(s)"),
    );
  }

  {
    // Check if all IDs are present in the structure they are pointing to
    // ... items of character types
    config.content.characterTypes.forEach((characterType) => {
      const errCallback = createIdErrorCallback(
        `Character Type ${characterType.id} items reference non-existent Item ID(s)`,
      );
      checkIfAllForeignIdsExist(characterType.items, config.content.items, errCallback);
    });
    // ... items required to solve challenges
    config.content.challenges.forEach((challenge) => {
      const errCallback = createIdErrorCallback(
        `Challenge ${challenge.id} solution references non-existent Item ID(s)`,
      );
      checkIfAllForeignIdsExist(
        challenge.solution.items.map(({ id }) => id),
        config.content.items,
        errCallback,
      );
    });
  }

  return config;
}
