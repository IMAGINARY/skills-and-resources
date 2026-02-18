TODO: Update to current project structure.

# AGENTS.md

Guidelines for AI agents working in the `pcsc-nfc` repository.

## Project Overview

TypeScript library for reading NFC tags via PC/SC-compatible readers (e.g. ACR122U).
When a tag is placed on the reader, the library auto-reads the UID and user data pages
and emits a `card` event with the complete `Card` object. ESM-first dual-package
(ESM + CJS). Single runtime dependency: `@pokusew/pcsclite`.

## Build / Test Commands

```bash
npm run build              # tsup -> dist/ (ESM + CJS + .d.ts)
npm test                   # vitest run (all unit tests)
npx vitest run test/nfc/constants.test.ts          # single test file
npx vitest run -t "builds correct READ BINARY"     # single test by name
npm run test:watch         # vitest watch mode
npm run test:hardware      # hardware tests (PCSC_TEST_HARDWARE=1, serial, 60s timeout)
```

No linter or formatter is configured. No CI/CD pipeline exists.

## Project Structure

```
src/nfc/
  index.ts              # Public API barrel exports
  NFC.ts                # Entry point wrapping pcsclite
  Reader.ts             # Core reader (auto-read on card detect)
  ACR122Reader.ts       # ACR122U/ACR1252U subclass (LED/buzzer/PICC)
  TypedEventEmitter.ts  # Type-safe EventEmitter (composition pattern)
  types.ts              # Interfaces and type constants (Card, TagType, etc.)
  constants.ts          # APDU commands, ATR parsing, PC/SC constants
  errors.ts             # Error class hierarchy
  result.ts             # Result<T, E> discriminated union
test/nfc/
  *.test.ts             # Unit tests
  hardware/             # Integration tests (env-gated, require real hardware)
```

## Code Style

### Imports

- Use `.ts` extension on relative imports:
  ```typescript
  import { Reader } from "./Reader.ts";
  ```
- Use `import type` for type-only imports; use inline `type` keyword in mixed imports:
  ```typescript
  import type { Card } from "./types.ts";
  import { type Result, Ok, Err } from "./result.ts";
  ```
- Named exports only. Never use default exports (exception: config files).
- Barrel re-exports in `index.ts` separate value and type exports:
  ```typescript
  export { NFC } from "./NFC.ts";
  export type { NfcEventMap } from "./NFC.ts";
  ```

### Formatting

- 2-space indent, single quotes, trailing commas in multi-line constructs.
- Use section dividers to organize source files:
  ```typescript
  // ---------------------------------------------------------------------------
  // Section name
  // ---------------------------------------------------------------------------
  ```

### Types

- TypeScript strict mode (`"strict": true`). All types must be explicit or inferable.
- Use `as const` objects with companion type aliases instead of enums:
  ```typescript
  const TagType = { MIFARE_CLASSIC_1K: 'MIFARE_CLASSIC_1K', ... } as const;
  type TagType = (typeof TagType)[keyof typeof TagType];
  ```
- Event maps are interfaces mapping event name to listener signature.

### Naming Conventions

| Element          | Convention            | Examples                                 |
| ---------------- | --------------------- | ---------------------------------------- |
| Class files      | PascalCase            | `Reader.ts`, `ACR122Reader.ts`           |
| Utility files    | camelCase             | `constants.ts`, `errors.ts`, `result.ts` |
| Test files       | kebab-case `.test.ts` | `typed-event-emitter.test.ts`            |
| Classes          | PascalCase            | `NFC`, `Reader`, `ACR122Reader`          |
| Interfaces/Types | PascalCase            | `Card`, `LedState`, `LedBuzzerOptions`   |
| Constants        | SCREAMING_SNAKE_CASE  | `CMD_GET_DATA_UID`, `SW_SUCCESS`         |
| Functions        | camelCase             | `buildReadCommand`, `parseAtr`           |
| Private fields   | underscore prefix     | `_card`, `_protocol`, `_closed`          |

### Error Handling

**Result-based pattern.** Never throw in normal control flow.

- All public async methods return `Promise<Result<T>>`, always resolving (never rejecting).
- All public sync getters return `Result<T>`.
- Use `Ok(value)` / `Err(new SomeError(...))` and early-return on failure:
  ```typescript
  if (!result.ok) return Err(new ReadError("failed", { cause: result.error }));
  ```
- Wrap underlying errors with `Error.cause` (ES2022 ErrorOptions).
- For promise-wrapped callbacks, always resolve with `Err(...)` on failure, never reject.
- Internal errors during auto-read are emitted via the `error` event, not thrown.

### Error Hierarchy

```
NfcError (extends Error)
  ReaderClosedError          CardRemovedError
  ConnectError               DisconnectError
  TransmitError              ApduError (has statusWord: number)
  ReadError                  UnsupportedTagError (has tagType: string)
  ControlError
  WriteError [not exported]  AuthError [not exported]
```

### Documentation

- Every public class, method, interface, and type must have JSDoc comments.
- Use `@param`, `@returns`, `@typeParam`, and `@example` tags.
- Source files start with a JSDoc module-level comment.

## Architecture

### Auto-read flow (Reader)

1. Connects to card (PC/SC shared mode)
2. Identifies tag: ATR parsing, then GET_VERSION refinement for Ultralight-compatible tags
3. Checks `TAG_DATA_RANGE` for support; emits `UnsupportedTagError` if absent
4. Reads UID via `GET DATA` APDU
5. Reads data pages via FAST_READ (bulk) or sequential READ BINARY (fallback)
6. Emits `card` with `{ uid, data, type }`; on removal emits `card.off`

### Key Patterns

- **Composition over inheritance**: `TypedEventEmitter` wraps `EventEmitter` internally;
  `emit()` is `protected` (only subclasses can emit).
- **Factory auto-detection**: `NFC.wrapReader()` selects `ACR122Reader` vs `Reader` via
  `ACR122_READER_PATTERN` regex on reader name.
- **Retry logic**: `Reader.transmit()` detects `SCARD_W_RESET_CARD` and auto-reconnects once.
- **Guard pattern**: ACR122Reader methods check `this._closed` at entry.

## Testing Conventions

- **Framework**: Vitest 3.x. Import `describe`, `it`, `expect` from `vitest`.
- **Imports**: directly from `../../src/nfc/*.ts` (not from the built package).
- **File naming**: mirrors source in kebab-case (`TypedEventEmitter.ts` -> `typed-event-emitter.test.ts`).
- **Hardware tests**: gated behind `PCSC_TEST_HARDWARE=1`, serial execution, 60s timeout.
- **Unit tests**: parallel execution, 5s timeout.

## Tech Stack

- TypeScript 5.4+ targeting ES2024, module ES2022, `moduleResolution: "bundler"`
- tsup (esbuild-based) for bundling (ESM + CJS)
- Vitest for testing
- Node.js with `@pokusew/pcsclite` native binding
