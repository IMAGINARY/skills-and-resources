import type { DeepReadonly } from "vue";
import {
  AppConfigSchema,
  ContentConfigSchema,
  withConfigFileUrl,
  collectDecodedAssetUrls,
} from "@/types/config.ts";
import { Value } from "typebox/value";
import YAML from "yaml";

import type { Config } from "@/types/config";
import type { Options } from "@/options/options.ts";
import { preloadAssets } from "@/config/preload.ts";

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

function resolveBelowBaseUrl(url: string, base: URL): URL {
  const resolved = new URL(url, base.href);
  if (!resolved.href.startsWith(base.href))
    throw new Error(`${url} must be below ${base.href}, but is resolved to ${resolved.href}`);
  return resolved;
}

async function fetchYaml(url: URL): Promise<any[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  const text = await response.text();
  const doc = YAML.parse(text);
  return doc;
}

export async function loadConfig(options: Options): Promise<DeepReadonly<Config>> {
  const baseUrl = new URL("config/", window.location.href);

  const appConfigUrl = resolveBelowBaseUrl(options.appCfg, baseUrl);
  console.log("Loading app config:", appConfigUrl.href);
  const appConfig = await fetchYaml(appConfigUrl);
  console.log("Loaded app config:", appConfig);

  const contentConfigUrl = resolveBelowBaseUrl(options.contentCfg, baseUrl);
  console.log("Loading content config:", contentConfigUrl.href);
  const contentConfig = await fetchYaml(contentConfigUrl);
  console.log("Loaded content config:", contentConfig);

  const appConfigValidationFailedText = "App config validation failed";
  const appConfigValidationFailedError = new Error(appConfigValidationFailedText);
  const contentConfigValidationFailedText = "Config validation failed";
  const contentConfigValidationFailedError = new Error(contentConfigValidationFailedText);

  // Validate config structures against the JSON Schema
  if (!Value.Check(AppConfigSchema, appConfig)) {
    // Collect detailed errors
    console.error(`${appConfigValidationFailedText}:`, ...Value.Errors(AppConfigSchema, appConfig));
    throw appConfigValidationFailedError;
  }

  if (!Value.Check(ContentConfigSchema, contentConfig)) {
    // Collect detailed errors
    const contentConfigValidationFailedText = "Content config validation failed";
    console.error(
      `${contentConfigValidationFailedText}:`,
      ...Value.Errors(ContentConfigSchema, contentConfig),
    );
    throw contentConfigValidationFailedError;
  }

  // Schema validation has passed: Decode config (asset URL resolution etc.)

  const { result: decodedAppConfig, assetUrls: appAssetUrls } = collectDecodedAssetUrls(() =>
    withConfigFileUrl(appConfigUrl, () => Value.Decode(AppConfigSchema, appConfig)),
  );
  console.log("Decoded app config:", decodedAppConfig);

  const { result: decodedContentConfig, assetUrls: contentAssetUrls } = collectDecodedAssetUrls(
    () =>
      withConfigFileUrl(contentConfigUrl, () => Value.Decode(ContentConfigSchema, contentConfig)),
  );
  console.log("Decoded content config:", decodedContentConfig);

  // Start asset preloading
  const assetUrls = new Set([...appAssetUrls, ...contentAssetUrls]);
  preloadAssets(Array.from(assetUrls)).then(() => console.log("Asset preloading completed."));

  const config = { app: decodedAppConfig, content: decodedContentConfig };

  const createIdErrorCallback =
    (msg: string): ((ids: string[]) => void) =>
    (ids: string[]) => {
      console.error(`${contentConfigValidationFailedText}: ${msg}`, ...ids);
      throw contentConfigValidationFailedError;
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
