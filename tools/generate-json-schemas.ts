import path from "node:path";
import fs from "node:fs";
import yaml from "js-yaml";

import { ConfigSchema } from "../src/types/config";

const specDir = "specs";

const generatedComment = "File generated from /src/types/config.ts. DO NOT EDIT!";

function prefixRef<T extends unknown>(o: T): T {
  if (typeof o !== "object" || o === null) return structuredClone(o);
  if (Array.isArray(o)) return o.map(prefixRef) as T;

  const entries = Object.entries(o);
  const entriesWithPrefixedRef = entries.map(([k, v]) => [
    k,
    k === "$ref" && typeof v === "string" ? `#/$defs/${v}` : prefixRef(v),
  ]);
  return Object.fromEntries(entriesWithPrefixedRef) as T;
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
const ConfigSchemaWithPrefixedRefs = prefixRef(ConfigSchema);
const ConfigSchemaExtracted = ConfigSchemaWithPrefixedRefs.$defs.Config;
const CleanedDefs = Object.fromEntries(
  Object.entries(ConfigSchemaWithPrefixedRefs.$defs).filter(([k]) => k !== "Config"),
) as PartialBy<typeof ConfigSchemaWithPrefixedRefs.$defs, "Config">;

const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  ...ConfigSchemaExtracted,
  $defs: CleanedDefs,
};
const schemaYamlString = `${generatedComment.replace(/^/, "# ")}\n` + yaml.dump(schema);
const schemaJsonString = JSON.stringify(schema, undefined, 2);
const projectRootPath = path.resolve(import.meta.dirname, "..");
const outputPathBase = path.resolve(projectRootPath, specDir);
const outputPathYaml = path.resolve(outputPathBase, "config.schema.yaml");
const outputPathJson = path.resolve(outputPathBase, "config.schema.json");
fs.mkdirSync(outputPathBase, { recursive: true });
fs.writeFileSync(outputPathYaml, schemaYamlString);
fs.writeFileSync(outputPathJson, schemaJsonString);
