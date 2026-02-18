// Core classes
export { NFC } from "./NFC.ts";
export { Reader } from "./Reader.ts";
export { ACR122Reader } from "./ACR122Reader.ts";

// Event maps
export type { NfcEventMap } from "./NFC.ts";
export type { ReaderEventMap } from "./Reader.ts";

// Types
export type { Card, TagType, PiccOperatingParameter, LedState, LedBuzzerOptions } from "./types.ts";
export { TagType as TagTypes } from "./types.ts";

// Errors
export {
  NfcError,
  ReaderClosedError,
  CardRemovedError,
  ConnectError,
  DisconnectError,
  TransmitError,
  ApduError,
  ReadError,
  UnsupportedTagError,
  ControlError,
} from "./errors.ts";

// Result
export { Ok, Err } from "./result.ts";
export type { Result } from "./result.ts";

// TypedEventEmitter (for advanced consumers / extension)
export { TypedEventEmitter } from "./TypedEventEmitter.ts";
