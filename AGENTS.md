# AGENTS.md

## Project Overview

Interactive exhibit with two sub-apps (ChallengeApp + InventoryApp) rendered side-by-side in a
scaled letterbox layout. NFC tokens identify characters; a separate token-reader tool bridges
physical NFC readers to the web app via WebSocket. Config and options are loaded from YAML files.

## Build & Run Commands

### Web App (root)

- `npm run dev` - Start development server with HMR
- `npm run build` - Typecheck and build for production
- `npm run preview` - Preview production build locally
- `npm run generate` - Run all generate scripts
- `npm run generate:config-schema` - Generate JSON Schema from TypeBox config schema
- `npm run typecheck` - Run TypeScript type checking only (`vue-tsc` against `tsconfig.web.json`)
- `npm run lint` - Run oxlint
- `npm run lint:fix` - Run oxlint with auto-fix
- `npm run format` - Format code with oxfmt

### Token Reader Tool (`tools/token-reader/`)

- `npm run token-reader -- <command>` - Run from repo root (delegates to `tools/token-reader`)
- Subcommands: `list`, `serve`, `monitor`, `simulate` (see `tools/token-reader/src/index.ts`)
- Has its own `package.json`; install deps separately with `npm install --prefix tools/token-reader`
- Uses tsx, commander, Ink (React TUI), and NFC/PC/SC libraries
- Lint/format/typecheck commands also available within `tools/token-reader/`

### Engine Requirement

Node `>=20.20.0 <21` (specified in both `package.json` files)

## Code Style

- **Formatting**: 2-space indentation, LF line endings, max 100 chars/line, trailing newline
- **Quotes**: Double quotes for strings (see imports in source files)
- **Types**: Use explicit types; prefer `type` imports (`import type { X }`)
- **Imports**: Group: 1) external packages, 2) internal `@/` aliases, 3) relative paths
- **Vue**: Use `<script setup lang="ts">` with Composition API; order: script, template, style
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Assertions**: Use `import { strict as assert } from "assert"` for runtime checks (polyfilled
  in-browser via `vite-plugin-node-polyfills`)
- **Linting**: oxlint with plugins: eslint, typescript, unicorn, oxc, import, vue
- **UI Components**: Use NuxtUI v4 components; prefer built-in components over custom ones
- **Config**: Split into `src/config/app.yaml` (UI strings) and `src/config/content.yaml` (exhibit
  content), loaded via `@modyfi/vite-plugin-yaml`. Types are derived from a TypeBox schema in
  `src/types/config.ts` (via `Static<>`). The merged config is validated at runtime against the
  TypeBox schema during startup (`Value.Check` in `src/config/config.ts`). A JSON Schema for
  external tooling is generated from the TypeBox schema into `specs/config.schema.json` via
  `npm run generate:config-schema`.
- **Options**: `src/options/options.yaml`, loaded via `@modyfi/vite-plugin-yaml`; types are still
  defined manually in `src/options/options.ts` (no runtime validation; has a TODO to adopt
  schema-based types)
- **TypeBox**: The `typebox` package (v1, imported as `"typebox"` / `"typebox/value"`) is used for
  runtime schema validation of the config file format and the WebSocket token-reader protocol.
  Config schemas are defined in `src/types/config.ts` using `Type.*` builders with companion
  `Static<>` types; the merged config is validated at startup via `Value.Check()` in
  `src/config/config.ts`. Token schemas are defined in `src/types/token.ts`; incoming messages
  are validated at runtime via `Value.Parse()` in `src/stores/token.ts`. Note: the token-reader tool
  (`tools/token-reader/`) defines its own parallel plain-TS types that must be kept in sync manually.
- **State**: Pinia stores in `src/stores/`; config and options injected via `provide`/`inject`
- **Routing**: No client-side routing; `vue-router` is a dependency only because NuxtUI requires it,
  but is configured with `router: false` in the Vite plugin
- **Project**: Vite 7 + Vue 3 + Pinia + NuxtUI v4 + Tailwind CSS 4 + VueUse + TypeBox +
  TypeScript (ES modules)
