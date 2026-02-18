/**
 * Constants for the pcsc-nfc library.
 *
 * APDU command/response bytes, ATR parsing tables, PC/SC status
 * flags, and NTAG page-size constants.
 */

import {
  TAG_ISO_14443_3,
  TAG_ISO_14443_4,
  type TagStandard,
  TagType,
  type PiccOperatingParameter,
  type LedState,
} from "./types.ts";

// ---------------------------------------------------------------------------
// PC/SC card reader state flags (bitmask)
// ---------------------------------------------------------------------------

/** PC/SC reader state flags from the SCARD_STATE_* constants. */
export const ReaderState = {
  UNAWARE: 0x0000,
  IGNORE: 0x0001,
  CHANGED: 0x0002,
  UNKNOWN: 0x0004,
  UNAVAILABLE: 0x0008,
  EMPTY: 0x0010,
  PRESENT: 0x0020,
  ATRMATCH: 0x0040,
  EXCLUSIVE: 0x0100,
  INUSE: 0x0200,
  MUTE: 0x0400,
} as const;

// ---------------------------------------------------------------------------
// APDU commands
// ---------------------------------------------------------------------------

/**
 * APDU command for GET DATA — retrieves the UID of the card.
 * CLA=FF, INS=CA, P1=00, P2=00, Le=00 (return all available bytes).
 */
export const CMD_GET_DATA_UID = Buffer.from([0xff, 0xca, 0x00, 0x00, 0x00]);

/**
 * READ BINARY command template.
 * CLA=FF, INS=B0, P1=00, P2=<page>, Le=<length>.
 *
 * For NTAG21x, each page is 4 bytes. The reader returns `length`
 * bytes starting from the given page.
 */
export function buildReadCommand(pageNumber: number, length: number): Buffer {
  return Buffer.from([0xff, 0xb0, 0x00, pageNumber, length]);
}

/**
 * UPDATE BINARY command template.
 * CLA=FF, INS=D6, P1=00, P2=<page>, Lc=<length>, Data=<...>.
 *
 * For NTAG21x, each write is exactly 4 bytes (one page).
 */
export function buildWriteCommand(pageNumber: number, data: Buffer): Buffer {
  const header = Buffer.from([0xff, 0xd6, 0x00, pageNumber, data.length]);
  return Buffer.concat([header, data]);
}

// ---------------------------------------------------------------------------
// APDU status words
// ---------------------------------------------------------------------------

/** Successful APDU response status word. */
export const SW_SUCCESS = 0x9000;

/** Parses the 2-byte status word from the end of an APDU response. */
export function getStatusWord(response: Buffer): number {
  if (response.length < 2) return 0;
  return (response[response.length - 2] << 8) | response[response.length - 1];
}

/** Returns the data portion of an APDU response (everything except SW). */
export function getResponseData(response: Buffer): Buffer {
  if (response.length < 2) return Buffer.alloc(0);
  return response.subarray(0, response.length - 2);
}

// ---------------------------------------------------------------------------
// NTAG / page-based constants
// ---------------------------------------------------------------------------

/** Page size for NTAG21x and MIFARE Ultralight tags (4 bytes per page). */
export const PAGE_SIZE = 4;

// ---------------------------------------------------------------------------
// ATR parsing — tag standard & type identification
// ---------------------------------------------------------------------------

/**
 * PC/SC Part 3 Supplemental ATR structure for contactless tags.
 *
 * The ATR embeds a Registered Application Provider Identifier (RID)
 * followed by tag identification bytes:
 *
 *   3B ... [historical bytes containing: 80 4F 0C A0 00 00 03 06 SS NN NN ...]
 *
 * Where:
 *   - `A0 00 00 03 06` = PC/SC RID (5 bytes)
 *   - `SS` = Standard byte (ISO 14443-3 = 0x03, ISO 14443-4 = varies)
 *   - `NN NN` = Card name (2 bytes, big-endian)
 *
 * The standard byte position in the ATR is determined relative to the
 * PC/SC RID. This parsing works with ACR122U, ACR1252U, and other
 * PC/SC-compliant readers.
 */

/**
 * PC/SC Registered Application Provider Identifier (RID).
 * Found in the ATR historical bytes of contactless readers.
 */
const PCSC_RID = Buffer.from([0xa0, 0x00, 0x00, 0x03, 0x06]);

/**
 * Standard byte mapping: the SS byte after the PC/SC RID.
 *
 * PC/SC Part 3 defines:
 *   - 0x03 = ISO 14443A, Part 3
 *   - 0x11 = FeliCa
 *
 * ACS readers also use byte index 4 for some ATR formats:
 *   - 0x01 = ISO 14443-3
 *   - 0x02 = ISO 14443-4
 */
export const ATR_STANDARD_MAP: Record<number, TagStandard> = {
  0x01: TAG_ISO_14443_3,
  0x02: TAG_ISO_14443_4,
  0x03: TAG_ISO_14443_3,
  0x11: TAG_ISO_14443_3, // FeliCa (ISO 18092, but contactless)
};

/**
 * ATR card name identification from the 2-byte NN field after the
 * PC/SC RID and SS byte.
 *
 * Key format: `0xMMNN` where MM = MSB, NN = LSB.
 */
export const ATR_TAG_TYPE_MAP: Record<number, TagType> = {
  // MIFARE family
  0x0001: TagType.MIFARE_CLASSIC_1K,
  0x0002: TagType.MIFARE_CLASSIC_4K,
  0x0003: TagType.MIFARE_ULTRALIGHT,
  0x0026: TagType.MIFARE_ULTRALIGHT_C,
  // MIFARE Mini is 0x0004, not separately typed
  0x003a: TagType.MIFARE_ULTRALIGHT_EV1,
  0x0030: TagType.TOPAZ_512,
  // NXP NTAG family (some readers report these directly)
  0xf004: TagType.NTAG_213,
  0xf005: TagType.NTAG_215,
  0xf007: TagType.NTAG_216,
  // FeliCa
  0xf011: TagType.FELICA,
  0xf012: TagType.FELICA,
  // JCOP
  0x0028: TagType.JCOP_30,
  0x0038: TagType.JCOP_31,
};

/**
 * Minimum ATR length for tag identification.
 * Below this length, ATR parsing cannot determine tag type.
 */
export const ATR_MIN_LENGTH = 10;

/**
 * Finds the PC/SC RID (`A0 00 00 03 06`) in an ATR buffer and returns
 * the index of the first byte of the RID, or -1 if not found.
 */
function findPcscRid(atr: Buffer): number {
  for (let i = 0; i <= atr.length - PCSC_RID.length; i++) {
    if (atr.subarray(i, i + PCSC_RID.length).equals(PCSC_RID)) {
      return i;
    }
  }
  return -1;
}

/**
 * Parse an ATR (Answer To Reset) buffer to extract tag standard
 * and tag type.
 *
 * Locates the PC/SC RID in the ATR historical bytes, then reads the
 * SS (standard) and NN (card name) bytes that follow it.
 *
 * Returns `null` for `standard` if it can't be determined.
 * Returns `TagType.UNKNOWN` for `type` if the ATR is too short,
 * doesn't contain the PC/SC RID, or the card name is unrecognized.
 */
export function parseAtr(atr: Buffer): {
  standard: TagStandard | null;
  type: TagType;
} {
  if (atr.length < ATR_MIN_LENGTH) {
    return { standard: null, type: TagType.UNKNOWN };
  }

  // Locate the PC/SC RID in the ATR
  const ridIndex = findPcscRid(atr);
  if (ridIndex < 0) {
    return { standard: null, type: TagType.UNKNOWN };
  }

  // After the RID (5 bytes): SS byte, then 2-byte card name (NN)
  const ssIndex = ridIndex + PCSC_RID.length;
  const nnIndex = ssIndex + 1;

  // Need at least SS + 2 bytes for NN
  if (nnIndex + 1 >= atr.length) {
    return { standard: null, type: TagType.UNKNOWN };
  }

  const standardByte = atr[ssIndex];
  const standard = ATR_STANDARD_MAP[standardByte] ?? null;

  const tagTypeMsb = atr[nnIndex];
  const tagTypeLsb = atr[nnIndex + 1];
  const tagTypeKey = (tagTypeMsb << 8) | tagTypeLsb;
  const type = ATR_TAG_TYPE_MAP[tagTypeKey] ?? TagType.UNKNOWN;

  return { standard, type };
}

// ---------------------------------------------------------------------------
// Tag type → user data page range
// ---------------------------------------------------------------------------

/**
 * User data page range for known tag types.
 *
 * - `startPage`: first user data page
 * - `pageCount`: number of user data pages
 *
 * Each page is {@link PAGE_SIZE} (4) bytes. Total user data =
 * `pageCount * PAGE_SIZE` bytes.
 */
// TODO: Split into NFC_FORUM_TYPE2_TAG_START_PAGE=3 and NFC_FORUM_TYPE2_TAG_NUM_PAGES= { ...}
export const TAG_DATA_RANGE: Partial<Record<TagType, { startPage: number; pageCount: number }>> = {
  // NTAG family
  [TagType.NTAG_213]: { startPage: 3, pageCount: 1 + 36 }, // page 3 for CC + pages 4-39 for 144 bytes user data
  [TagType.NTAG_215]: { startPage: 3, pageCount: 1 + 126 }, // page 3 for CC + pages 4-129 for 504 bytes user data
  [TagType.NTAG_216]: { startPage: 3, pageCount: 1 + 222 }, // page 3 for CC + pages 4-225 for 888 bytes user data
  [TagType.NTAG_203]: { startPage: 3, pageCount: 1 + 36 }, // page 3 for CC + pages 4-39 for 144 bytes user data
  [TagType.NTAG_210]: { startPage: 3, pageCount: 1 + 4 }, // page 3 for CC + pages 4-7 for 16 bytes user data
  [TagType.NTAG_212]: { startPage: 3, pageCount: 1 + 32 }, // page 3 for CC + pages 4-35 for 128 bytes user data
  // MIFARE Ultralight family
  [TagType.MIFARE_ULTRALIGHT]: { startPage: 3, pageCount: 1 + 12 }, // pages 4-15,  48 bytes
  [TagType.MIFARE_ULTRALIGHT_C]: { startPage: 3, pageCount: 1 + 36 }, // pages 4-39,  144 bytes
  [TagType.MIFARE_ULTRALIGHT_EV1]: { startPage: 3, pageCount: 1 + 36 }, // pages 4-39,  144 bytes (UL EV1 varies; 36 is a safe default)
};

// ---------------------------------------------------------------------------
// FAST_READ — bulk page reading for NTAG / MIFARE Ultralight EV1
// ---------------------------------------------------------------------------

/**
 * Tag types that support the NXP FAST_READ command (0x3A).
 *
 * FAST_READ reads a contiguous range of pages in a single command,
 * significantly faster than sequential READ BINARY APDUs. It is
 * supported by NTAG21x and MIFARE Ultralight EV1 tags, but NOT by
 * plain MIFARE Ultralight, MIFARE Ultralight C, or NTAG203.
 */
export const FAST_READ_TAG_TYPES: ReadonlySet<TagType> = new Set([
  TagType.NTAG_210,
  TagType.NTAG_212,
  TagType.NTAG_213,
  TagType.NTAG_215,
  TagType.NTAG_216,
  TagType.MIFARE_ULTRALIGHT_EV1,
]);

/**
 * Maximum number of pages per single FAST_READ command.
 *
 * The PN532's internal buffer is ~265 bytes. After accounting for the
 * InCommunicateThru response overhead (D5 43 <status> = 3 bytes), the
 * maximum payload is ~262 bytes. At 4 bytes per page, this allows
 * reading up to 60 pages per command. We use a conservative limit to
 * stay well within the buffer.
 */
export const FAST_READ_MAX_PAGES = 60;

/**
 * Builds a FAST_READ command (NXP 0x3A) wrapped in a PN532
 * InCommunicateThru pseudo-APDU for PC/SC transmission.
 *
 * FAST_READ reads pages `startPage` through `endPage` (inclusive)
 * in a single command. The response contains
 * `(endPage - startPage + 1) * 4` bytes of page data.
 *
 * Wrapped APDU format:
 *   FF 00 00 00 05 D4 42 3A <startPage> <endPage>
 *
 * @param startPage - First page to read (inclusive)
 * @param endPage - Last page to read (inclusive)
 */
export function buildFastReadCommand(startPage: number, endPage: number): Buffer {
  return Buffer.from([
    0xff,
    0x00,
    0x00,
    0x00, // Direct Transmit pseudo-APDU
    0x05, // Lc = 5 bytes follow
    0xd4,
    0x42, // PN532 InCommunicateThru
    0x3a, // NFC FAST_READ command
    startPage, // First page (inclusive)
    endPage, // Last page (inclusive)
  ]);
}

// ---------------------------------------------------------------------------
// GET VERSION — NTAG / MIFARE Ultralight EV1 identification
// ---------------------------------------------------------------------------

/**
 * NXP GET_VERSION command (0x60), wrapped for PC/SC transmission.
 *
 * On ACR122U (PN532-based) readers, native NFC commands must be
 * sent via the Direct Transmit pseudo-APDU wrapping the PN532
 * `InCommunicateThru` (D4 42) command:
 *
 *   FF 00 00 00 03 D4 42 60
 *
 * The response (when successful) contains a PN532 response prefix
 * (D5 43 00) followed by the 8-byte GET_VERSION data, then the
 * 2-byte PC/SC status word (90 00).
 *
 * Supported by: NTAG21x, MIFARE Ultralight EV1.
 * Not supported by: plain MIFARE Ultralight, MIFARE Classic.
 */
export const CMD_GET_VERSION = Buffer.from([
  0xff,
  0x00,
  0x00,
  0x00, // Direct Transmit pseudo-APDU
  0x03, // Lc = 3 bytes follow
  0xd4,
  0x42, // PN532 InCommunicateThru
  0x60, // NFC GET_VERSION command
]);

/**
 * Maps the (product type, storage size) pair from GET_VERSION to a
 * specific {@link TagType}.
 *
 * GET_VERSION response bytes (after unwrapping SW):
 *   [0] = fixed header (0x00)
 *   [1] = vendor ID (0x04 = NXP)
 *   [2] = product type (0x04 = NTAG, 0x03 = UL EV1)
 *   [3] = product sub-type
 *   [4] = major version
 *   [5] = minor version
 *   [6] = storage size byte
 *   [7] = protocol type
 *
 * Key format: `(productType << 8) | storageSize`
 */
export const VERSION_TAG_TYPE_MAP: Record<number, TagType> = {
  // NTAG family (product type 0x04)
  0x0406: TagType.NTAG_210, // storage = 0x06 (48 bytes)
  0x040a: TagType.NTAG_212, // storage = 0x0A (128+)
  0x040f: TagType.NTAG_213, // storage = 0x0F (144 bytes)
  0x0411: TagType.NTAG_215, // storage = 0x11 (504 bytes)
  0x0413: TagType.NTAG_216, // storage = 0x13 (888 bytes)
  // MIFARE Ultralight EV1 (product type 0x03)
  0x030b: TagType.MIFARE_ULTRALIGHT_EV1, // storage = 0x0B (48 bytes, MF0UL11)
  0x030e: TagType.MIFARE_ULTRALIGHT_EV1, // storage = 0x0E (128 bytes, MF0UL21)
};

/**
 * Parses a GET_VERSION response (data portion, without SW bytes) to
 * determine the specific tag type.
 *
 * @param versionData - The 8-byte GET_VERSION response data (SW stripped)
 * @returns The identified TagType, or `null` if unrecognized
 */
export function parseGetVersion(versionData: Buffer): TagType | null {
  // GET_VERSION returns 8 bytes
  if (versionData.length < 7) return null;

  const productType = versionData[2];
  const storageSize = versionData[6];
  const key = (productType << 8) | storageSize;

  return VERSION_TAG_TYPE_MAP[key] ?? null;
}

// ---------------------------------------------------------------------------
// ACR122U-specific pseudo-APDU commands
// ---------------------------------------------------------------------------

/**
 * ACR122U: Get firmware version.
 * Pseudo-APDU: FF 00 48 00 00
 */
export const ACR122_CMD_GET_FIRMWARE = Buffer.from([0xff, 0x00, 0x48, 0x00, 0x00]);

/**
 * ACR122U: Get PICC operating parameter.
 * Pseudo-APDU: FF 00 50 00 00
 */
export const ACR122_CMD_GET_PICC = Buffer.from([0xff, 0x00, 0x50, 0x00, 0x00]);

/**
 * ACR122U: Set PICC operating parameter.
 * Pseudo-APDU: FF 00 51 <param> 00
 */
export function buildSetPiccCommand(param: number): Buffer {
  return Buffer.from([0xff, 0x00, 0x51, param, 0x00]);
}

/**
 * ACR122U: Set buzzer output enable for card detection.
 * Pseudo-APDU: FF 00 52 <param> 00
 *
 * - `0xFF` — buzzer sounds on card detection (factory default)
 * - `0x00` — buzzer is silent on card detection
 *
 * **Note:** This command is NOT available on the ACR1252U's
 * ACR122U compatibility layer.
 *
 * @param enabled - `true` to enable the buzzer on detection, `false` to disable.
 */
export function buildSetBuzzerOnDetectionCommand(enabled: boolean): Buffer {
  return Buffer.from([0xff, 0x00, 0x52, enabled ? 0xff : 0x00, 0x00]);
}

/**
 * Converts a raw PICC operating parameter byte into a
 * {@link PiccOperatingParameter} record.
 *
 * @param byte - The raw parameter byte (0x00–0xFF).
 * @returns A record with one boolean per parameter bit.
 */
export function parsePiccParameter(byte: number): PiccOperatingParameter {
  return {
    autoPolling: !!(byte & 0x80),
    autoAtsGeneration: !!(byte & 0x40),
    shortPollingInterval: !!(byte & 0x20),
    detectFelica424K: !!(byte & 0x10),
    detectFelica212K: !!(byte & 0x08),
    detectIso14443B: !!(byte & 0x04),
    detectIso14443A: !!(byte & 0x02),
    detectMifare: !!(byte & 0x01),
  };
}

/**
 * Converts a {@link PiccOperatingParameter} record back into the
 * raw parameter byte expected by the ACR122U SET PICC command.
 *
 * @param param - The PICC operating parameter record.
 * @returns The raw byte (0x00–0xFF).
 */
export function buildPiccParameterByte(param: PiccOperatingParameter): number {
  let byte = 0;
  if (param.autoPolling) byte |= 0x80;
  if (param.autoAtsGeneration) byte |= 0x40;
  if (param.shortPollingInterval) byte |= 0x20;
  if (param.detectFelica424K) byte |= 0x10;
  if (param.detectFelica212K) byte |= 0x08;
  if (param.detectIso14443B) byte |= 0x04;
  if (param.detectIso14443A) byte |= 0x02;
  if (param.detectMifare) byte |= 0x01;
  return byte;
}

/**
 * ACR122U: LED and buzzer control.
 * Pseudo-APDU: FF 00 40 <ledState> 04 <t1> <t2> <reps> <buzzer>
 *
 * @param ledState - P2 byte controlling LED state/blink bits
 * @param t1 - T1 duration (units of 100ms)
 * @param t2 - T2 duration (units of 100ms)
 * @param repetitions - Number of blink cycles
 * @param buzzerBits - Buzzer control byte (bit 0 = T1, bit 1 = T2)
 */
export function buildLedBuzzerCommand(
  ledState: number,
  t1: number,
  t2: number,
  repetitions: number,
  buzzerBits: number,
): Buffer {
  return Buffer.from([0xff, 0x00, 0x40, ledState, 0x04, t1, t2, repetitions, buzzerBits]);
}

/**
 * Parses the LED state byte from an ACR122U LED+buzzer response.
 *
 * The ACR122U returns the current LED state in the second byte of
 * the response (SW2). The bit layout is:
 *
 * - Bit 0: Red LED (1 = on, 0 = off)
 * - Bit 1: Green LED (1 = on, 0 = off)
 * - Bits 2–7: Reserved
 *
 * @param byte - The LED state byte from the response.
 * @returns The parsed LED state.
 */
export function parseLedStateByte(byte: number): LedState {
  return {
    red: (byte & 0x01) !== 0,
    green: (byte & 0x02) !== 0,
  };
}

// ---------------------------------------------------------------------------
// Reader name patterns for auto-detection
// ---------------------------------------------------------------------------

/**
 * Regex to detect ACR122U or ACR1252U readers (which support
 * the ACR122U compatibility command set).
 */
export const ACR122_READER_PATTERN = /ACR122|ACR1252/i;

// ---------------------------------------------------------------------------
// Transmit defaults
// ---------------------------------------------------------------------------

/** Default max response length for transmit operations. */
export const DEFAULT_RESPONSE_MAX_LENGTH = 260;
