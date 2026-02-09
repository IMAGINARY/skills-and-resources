// Token types shared between the token-reader server and the renderer client.
// These must match the types in tools/token-reader/src/token-reader.ts
import { Type, Static } from "typebox";

// Base types
export const TokenIdSchema = Type.String({ $id: "TokenId" });
export type TokenId = Static<typeof TokenIdSchema>;

export const TokenClassSchema = Type.String({ $id: "TokenClass" });
export type TokenClass = Static<typeof TokenClassSchema>;

export const TokenSchema = Type.Object(
  {
    id: TokenIdSchema,
    class: TokenClassSchema,
  },
  { $id: "Token" },
);
export type Token = Static<typeof TokenSchema>;

// Enums
const TokenStateTypeAbsentSchema = Type.Literal("absent");
const TokenStateTypeReadingSchema = Type.Literal("reading");
const TokenStateTypePresentSchema = Type.Literal("present");
const TokenStateTypeErrorSchema = Type.Literal("error");
export const TokenStateTypeSchema = Type.Union(
  [
    TokenStateTypeAbsentSchema,
    TokenStateTypeReadingSchema,
    TokenStateTypePresentSchema,
    TokenStateTypeErrorSchema,
  ],
  { $id: "TokenStateType" },
);
export type TokenStateType = Static<typeof TokenStateTypeSchema>;
export const TokenStateType = {
  ABSENT: TokenStateTypeAbsentSchema.const,
  READING: TokenStateTypeReadingSchema.const,
  PRESENT: TokenStateTypePresentSchema.const,
  ERROR: TokenStateTypeErrorSchema.const,
} as const;

const TokenErrorTypeNFCReadingErrorSchema = Type.Literal(0);
const TokenErrorTypeNFCReadInterruptedSchema = Type.Literal(1);
const TokenErrorTypeNFCUidInvalidSchema = Type.Literal(2);
const TokenErrorTypeNFCDataInvalidSchema = Type.Literal(3);
const TokenErrorTypeNFCTimeoutSchema = Type.Literal(4);
export const TokenErrorTypeNFCSchema = Type.Union(
  [
    TokenErrorTypeNFCReadingErrorSchema,
    TokenErrorTypeNFCReadInterruptedSchema,
    TokenErrorTypeNFCUidInvalidSchema,
    TokenErrorTypeNFCDataInvalidSchema,
    TokenErrorTypeNFCTimeoutSchema,
  ],
  { $id: "TokenErrorTypeNFC" },
);
export type TokenErrorTypeNFC = Static<typeof TokenErrorTypeNFCSchema>;
export const TokenErrorTypeNFC = {
  READER_ERROR: TokenErrorTypeNFCReadingErrorSchema.const,
  READ_INTERRUPTED: TokenErrorTypeNFCReadInterruptedSchema.const,
  UID_INVALID: TokenErrorTypeNFCUidInvalidSchema.const,
  DATA_INVALID: TokenErrorTypeNFCDataInvalidSchema.const,
  TIMEOUT: TokenErrorTypeNFCTimeoutSchema.const,
} as const;

export const TokenErrorDetailsNFCSchema = Type.String({ $id: "TokenErrorDetailsNFC" });
export type TokenErrorDetailsNFC = Static<typeof TokenErrorDetailsNFCSchema>;

export const TokenErrorNFCSchema = Type.Object(
  {
    type: TokenErrorTypeNFCSchema,
    details: TokenErrorDetailsNFCSchema,
  },
  { $id: "TokenErrorNFC" },
);
export type TokenErrorNFC = Static<typeof TokenErrorNFCSchema>;

// Discriminated union for TokenStateNFC
export const TokenStateNFCSchema = Type.Union(
  [
    Type.Object({
      state: TokenStateTypeAbsentSchema,
    }),
    Type.Object({
      state: TokenStateTypeReadingSchema,
    }),
    Type.Object({
      state: TokenStateTypePresentSchema,
      token: TokenSchema,
    }),
    Type.Object({
      state: TokenStateTypeErrorSchema,
      error: TokenErrorNFCSchema,
    }),
  ],
  { $id: "TokenStateNFC" },
);
export type TokenStateNFC = Static<typeof TokenStateNFCSchema>;

// WebSocket message format from the token-reader server
export const TokenReaderMessageSchema = Type.Object(
  {
    inventory: TokenStateNFCSchema,
    challenge: TokenStateNFCSchema,
  },
  {
    $id: "TokenReaderMessage",
    description: "WebSocket message format from the token-reader server",
  },
);
export type TokenReaderMessage = Static<typeof TokenReaderMessageSchema>;
