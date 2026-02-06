// Token types shared between the token-reader server and the renderer client.
// These must match the types in tools/token-reader/src/token-reader.ts

export type TokenId = string;
export type TokenClass = string;
export type Token = { id: TokenId; class: TokenClass };

export enum TokenStateType {
  ABSENT = "absent",
  READING = "reading",
  PRESENT = "present",
  ERROR = "error",
}

export enum TokenErrorTypeNFC {
  READER_ERROR = 0,
  READ_INTERRUPTED = 1,
  UID_INVALID = 2,
  DATA_INVALID = 3,
  TIMEOUT = 4,
}

export type TokenErrorDetailsNFC = string;

export type TokenErrorNFC = {
  type: TokenErrorTypeNFC;
  details: TokenErrorDetailsNFC;
};

export type TokenStateNFC =
  | { state: TokenStateType.ABSENT }
  | { state: TokenStateType.READING }
  | { state: TokenStateType.PRESENT; token: Token }
  | { state: TokenStateType.ERROR; error: TokenErrorNFC };

// WebSocket message format from the token-reader server
export type TokenReaderMessage = { inventory: TokenStateNFC; challenge: TokenStateNFC };
