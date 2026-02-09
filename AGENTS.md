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
- **Assertions**: Use `import { strict as assert } from "assert"` for runtime checks
- **Linting**: oxlint with plugins: eslint, typescript, unicorn, oxc, import, vue
- **UI Components**: Use NuxtUI v4 components; prefer built-in components over custom ones
- **Config/Options**: YAML files in `src/config/` and `src/options/`, loaded via
  `@modyfi/vite-plugin-yaml`; types defined manually alongside each YAML file
- **State**: Pinia stores in `src/stores/`; config and options injected via `provide`/`inject`
- **Project**: Vite + Vue 3 + Pinia + NuxtUI v4 + VueUse + TypeScript (ES modules)
