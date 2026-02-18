import { describe, it, expect } from "vitest";
import {
  buildReadCommand,
  buildWriteCommand,
  buildLedBuzzerCommand,
  parseLedStateByte,
  buildSetPiccCommand,
  buildSetBuzzerOnDetectionCommand,
  buildFastReadCommand,
  parsePiccParameter,
  buildPiccParameterByte,
  getStatusWord,
  getResponseData,
  parseAtr,
  parseGetVersion,
  CMD_GET_DATA_UID,
  CMD_GET_VERSION,
  ACR122_CMD_GET_FIRMWARE,
  ACR122_CMD_GET_PICC,
  ACR122_READER_PATTERN,
  SW_SUCCESS,
  PAGE_SIZE,
  ATR_MIN_LENGTH,
  TAG_DATA_RANGE,
  VERSION_TAG_TYPE_MAP,
  FAST_READ_TAG_TYPES,
  FAST_READ_MAX_PAGES,
} from "../../src/nfc/constants.ts";
import { TAG_ISO_14443_3, TAG_ISO_14443_4, TagType } from "../../src/nfc/types.ts";
import type { PiccOperatingParameter } from "../../src/nfc/types.ts";

// ---------------------------------------------------------------------------
// Static APDU commands
// ---------------------------------------------------------------------------

describe("CMD_GET_DATA_UID", () => {
  it("is FF CA 00 00 00", () => {
    expect(CMD_GET_DATA_UID).toEqual(Buffer.from([0xff, 0xca, 0x00, 0x00, 0x00]));
  });
});

describe("ACR122_CMD_GET_FIRMWARE", () => {
  it("is FF 00 48 00 00", () => {
    expect(ACR122_CMD_GET_FIRMWARE).toEqual(Buffer.from([0xff, 0x00, 0x48, 0x00, 0x00]));
  });
});

describe("ACR122_CMD_GET_PICC", () => {
  it("is FF 00 50 00 00", () => {
    expect(ACR122_CMD_GET_PICC).toEqual(Buffer.from([0xff, 0x00, 0x50, 0x00, 0x00]));
  });
});

// ---------------------------------------------------------------------------
// APDU builders
// ---------------------------------------------------------------------------

describe("buildReadCommand", () => {
  it("builds correct READ BINARY command for a page", () => {
    const cmd = buildReadCommand(0x04, 0x04);
    expect(cmd).toEqual(Buffer.from([0xff, 0xb0, 0x00, 0x04, 0x04]));
  });

  it("handles page 0 with length 4", () => {
    const cmd = buildReadCommand(0x00, 0x04);
    expect(cmd).toEqual(Buffer.from([0xff, 0xb0, 0x00, 0x00, 0x04]));
  });

  it("can request 16 bytes (4 pages)", () => {
    const cmd = buildReadCommand(0x04, 0x10);
    expect(cmd).toEqual(Buffer.from([0xff, 0xb0, 0x00, 0x04, 0x10]));
  });
});

describe("buildWriteCommand", () => {
  it("builds correct UPDATE BINARY command for a 4-byte page", () => {
    const data = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    const cmd = buildWriteCommand(0x05, data);
    expect(cmd).toEqual(Buffer.from([0xff, 0xd6, 0x00, 0x05, 0x04, 0x01, 0x02, 0x03, 0x04]));
  });

  it("includes correct page number and data length", () => {
    const data = Buffer.from([0xaa, 0xbb, 0xcc, 0xdd]);
    const cmd = buildWriteCommand(0x08, data);
    expect(cmd.length).toBe(5 + 4);
    expect(cmd[0]).toBe(0xff);
    expect(cmd[1]).toBe(0xd6);
    expect(cmd[3]).toBe(0x08);
    expect(cmd[4]).toBe(4);
    expect(cmd.subarray(5)).toEqual(data);
  });
});

describe("buildSetPiccCommand", () => {
  it("builds correct SET PICC command", () => {
    const cmd = buildSetPiccCommand(0xff);
    expect(cmd).toEqual(Buffer.from([0xff, 0x00, 0x51, 0xff, 0x00]));
  });
});

describe("buildSetBuzzerOnDetectionCommand", () => {
  it("builds enable command with 0xFF param", () => {
    const cmd = buildSetBuzzerOnDetectionCommand(true);
    expect(cmd).toEqual(Buffer.from([0xff, 0x00, 0x52, 0xff, 0x00]));
  });

  it("builds disable command with 0x00 param", () => {
    const cmd = buildSetBuzzerOnDetectionCommand(false);
    expect(cmd).toEqual(Buffer.from([0xff, 0x00, 0x52, 0x00, 0x00]));
  });
});

// ---------------------------------------------------------------------------
// PICC parameter conversion
// ---------------------------------------------------------------------------

const ALL_ENABLED: PiccOperatingParameter = {
  autoPolling: true,
  autoAtsGeneration: true,
  shortPollingInterval: true,
  detectFelica424K: true,
  detectFelica212K: true,
  detectIso14443B: true,
  detectIso14443A: true,
  detectMifare: true,
};

const ALL_DISABLED: PiccOperatingParameter = {
  autoPolling: false,
  autoAtsGeneration: false,
  shortPollingInterval: false,
  detectFelica424K: false,
  detectFelica212K: false,
  detectIso14443B: false,
  detectIso14443A: false,
  detectMifare: false,
};

describe("parsePiccParameter", () => {
  it("parses 0xFF as all enabled", () => {
    expect(parsePiccParameter(0xff)).toEqual(ALL_ENABLED);
  });

  it("parses 0x00 as all disabled", () => {
    expect(parsePiccParameter(0x00)).toEqual(ALL_DISABLED);
  });

  it("parses individual bits correctly", () => {
    const cases: [number, keyof PiccOperatingParameter][] = [
      [0x80, "autoPolling"],
      [0x40, "autoAtsGeneration"],
      [0x20, "shortPollingInterval"],
      [0x10, "detectFelica424K"],
      [0x08, "detectFelica212K"],
      [0x04, "detectIso14443B"],
      [0x02, "detectIso14443A"],
      [0x01, "detectMifare"],
    ];

    for (const [bit, key] of cases) {
      const result = parsePiccParameter(bit);
      for (const k of Object.keys(result) as (keyof PiccOperatingParameter)[]) {
        expect(result[k]).toBe(k === key);
      }
    }
  });

  it("parses a mixed value (0xE1)", () => {
    // 0xE1 = 11100001 = autoPolling + autoAts + shortPolling + detectMifare
    const result = parsePiccParameter(0xe1);
    expect(result).toEqual({
      autoPolling: true,
      autoAtsGeneration: true,
      shortPollingInterval: true,
      detectFelica424K: false,
      detectFelica212K: false,
      detectIso14443B: false,
      detectIso14443A: false,
      detectMifare: true,
    });
  });
});

describe("buildPiccParameterByte", () => {
  it("builds 0xFF from all enabled", () => {
    expect(buildPiccParameterByte(ALL_ENABLED)).toBe(0xff);
  });

  it("builds 0x00 from all disabled", () => {
    expect(buildPiccParameterByte(ALL_DISABLED)).toBe(0x00);
  });

  it("builds correct byte for individual flags", () => {
    const base = { ...ALL_DISABLED };

    expect(buildPiccParameterByte({ ...base, autoPolling: true })).toBe(0x80);
    expect(buildPiccParameterByte({ ...base, autoAtsGeneration: true })).toBe(0x40);
    expect(buildPiccParameterByte({ ...base, shortPollingInterval: true })).toBe(0x20);
    expect(buildPiccParameterByte({ ...base, detectFelica424K: true })).toBe(0x10);
    expect(buildPiccParameterByte({ ...base, detectFelica212K: true })).toBe(0x08);
    expect(buildPiccParameterByte({ ...base, detectIso14443B: true })).toBe(0x04);
    expect(buildPiccParameterByte({ ...base, detectIso14443A: true })).toBe(0x02);
    expect(buildPiccParameterByte({ ...base, detectMifare: true })).toBe(0x01);
  });

  it("round-trips through parsePiccParameter for every byte value", () => {
    for (let byte = 0x00; byte <= 0xff; byte++) {
      expect(buildPiccParameterByte(parsePiccParameter(byte))).toBe(byte);
    }
  });
});

describe("buildLedBuzzerCommand", () => {
  it("builds correct LED+buzzer command", () => {
    const cmd = buildLedBuzzerCommand(0x0f, 0x01, 0x01, 0x03, 0x01);
    expect(cmd).toEqual(Buffer.from([0xff, 0x00, 0x40, 0x0f, 0x04, 0x01, 0x01, 0x03, 0x01]));
  });

  it("all zeros produces silent/no-op", () => {
    const cmd = buildLedBuzzerCommand(0x00, 0x00, 0x00, 0x00, 0x00);
    expect(cmd).toEqual(Buffer.from([0xff, 0x00, 0x40, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00]));
  });
});

describe("parseLedStateByte", () => {
  it("parses 0x00 as both LEDs off", () => {
    expect(parseLedStateByte(0x00)).toEqual({ red: false, green: false });
  });

  it("parses 0x01 as red on, green off", () => {
    expect(parseLedStateByte(0x01)).toEqual({ red: true, green: false });
  });

  it("parses 0x02 as red off, green on", () => {
    expect(parseLedStateByte(0x02)).toEqual({ red: false, green: true });
  });

  it("parses 0x03 as both LEDs on", () => {
    expect(parseLedStateByte(0x03)).toEqual({ red: true, green: true });
  });

  it("ignores upper bits (0xFF → both on)", () => {
    expect(parseLedStateByte(0xff)).toEqual({ red: true, green: true });
  });

  it("ignores upper bits (0xFC → both off)", () => {
    expect(parseLedStateByte(0xfc)).toEqual({ red: false, green: false });
  });
});

// ---------------------------------------------------------------------------
// Status word parsing
// ---------------------------------------------------------------------------

describe("getStatusWord", () => {
  it("extracts 0x9000 from successful response", () => {
    const response = Buffer.from([0x01, 0x02, 0x03, 0x90, 0x00]);
    expect(getStatusWord(response)).toBe(0x9000);
  });

  it("extracts 0x6300 from failed response", () => {
    const response = Buffer.from([0x63, 0x00]);
    expect(getStatusWord(response)).toBe(0x6300);
  });

  it("returns 0 for empty buffer", () => {
    expect(getStatusWord(Buffer.alloc(0))).toBe(0);
  });

  it("returns 0 for single-byte buffer", () => {
    expect(getStatusWord(Buffer.from([0x90]))).toBe(0);
  });
});

describe("getResponseData", () => {
  it("returns data without status word", () => {
    const response = Buffer.from([0x01, 0x02, 0x03, 0x90, 0x00]);
    expect(getResponseData(response)).toEqual(Buffer.from([0x01, 0x02, 0x03]));
  });

  it("returns empty buffer for status-only response", () => {
    const response = Buffer.from([0x90, 0x00]);
    expect(getResponseData(response)).toEqual(Buffer.alloc(0));
  });

  it("returns empty buffer for empty input", () => {
    expect(getResponseData(Buffer.alloc(0))).toEqual(Buffer.alloc(0));
  });
});

// ---------------------------------------------------------------------------
// ATR parsing
// ---------------------------------------------------------------------------

/**
 * Builds a PC/SC Part 3 compliant ATR with the given standard (SS)
 * and card name (NN) bytes.
 *
 * Format: 3B 8F 80 01 80 4F 0C A0 00 00 03 06 <SS> <NN_MSB> <NN_LSB> 00 00 00 00 <TCK>
 */
function buildTestAtr(ss: number, nnMsb: number, nnLsb: number): Buffer {
  const bytes = [
    0x3b,
    0x8f,
    0x80,
    0x01, // TS, T0, TD1, TD2
    0x80, // Category indicator
    0x4f,
    0x0c, // AID tag, 12 bytes follow
    0xa0,
    0x00,
    0x00,
    0x03,
    0x06, // PC/SC RID
    ss, // SS (standard byte)
    nnMsb,
    nnLsb, // NN (card name)
    0x00,
    0x00,
    0x00,
    0x00, // RFU
    0x00, // TCK (placeholder)
  ];
  return Buffer.from(bytes);
}

describe("parseAtr", () => {
  it("returns UNKNOWN for ATR shorter than minimum", () => {
    const result = parseAtr(Buffer.from([0x3b, 0x8f, 0x80, 0x01]));
    expect(result.standard).toBeNull();
    expect(result.type).toBe(TagType.UNKNOWN);
  });

  it("returns UNKNOWN when PC/SC RID is not present", () => {
    // 10-byte ATR without the RID
    const atr = Buffer.from([0x3b, 0x8f, 0x80, 0x01, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00]);
    const result = parseAtr(atr);
    expect(result.standard).toBeNull();
    expect(result.type).toBe(TagType.UNKNOWN);
  });

  it("parses ISO 14443-3 standard byte (SS=0x03)", () => {
    const atr = buildTestAtr(0x03, 0x00, 0x03);
    const result = parseAtr(atr);
    expect(result.standard).toBe(TAG_ISO_14443_3);
  });

  it("parses ISO 14443-4 standard byte (SS=0x02)", () => {
    const atr = buildTestAtr(0x02, 0x00, 0x01);
    const result = parseAtr(atr);
    expect(result.standard).toBe(TAG_ISO_14443_4);
  });

  it("detects MIFARE Classic 1K from card name bytes", () => {
    const atr = buildTestAtr(0x03, 0x00, 0x01);
    const result = parseAtr(atr);
    expect(result.type).toBe(TagType.MIFARE_CLASSIC_1K);
  });

  it("detects MIFARE Classic 4K from card name bytes", () => {
    const atr = buildTestAtr(0x03, 0x00, 0x02);
    const result = parseAtr(atr);
    expect(result.type).toBe(TagType.MIFARE_CLASSIC_4K);
  });

  it("detects MIFARE Ultralight from card name bytes", () => {
    const atr = buildTestAtr(0x03, 0x00, 0x03);
    const result = parseAtr(atr);
    expect(result.type).toBe(TagType.MIFARE_ULTRALIGHT);
  });

  it("parses the actual NTAG215 ATR from ACR122U (reports as MIFARE Ultralight)", () => {
    // Real ATR captured from hardware: NTAG215 on ACR122U
    const atr = Buffer.from([
      0x3b, 0x8f, 0x80, 0x01, 0x80, 0x4f, 0x0c, 0xa0, 0x00, 0x00, 0x03, 0x06, 0x03, 0x00, 0x03,
      0x00, 0x00, 0x00, 0x00, 0x68,
    ]);
    const result = parseAtr(atr);
    expect(result.standard).toBe(TAG_ISO_14443_3);
    expect(result.type).toBe(TagType.MIFARE_ULTRALIGHT);
  });

  it("returns UNKNOWN for unrecognized card name bytes", () => {
    const atr = buildTestAtr(0x03, 0xff, 0xff);
    const result = parseAtr(atr);
    expect(result.type).toBe(TagType.UNKNOWN);
  });

  it("returns null standard for unrecognized standard byte", () => {
    const atr = buildTestAtr(0xff, 0x00, 0x01);
    const result = parseAtr(atr);
    expect(result.standard).toBeNull();
    // Card name should still be parsed
    expect(result.type).toBe(TagType.MIFARE_CLASSIC_1K);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("constants", () => {
  it("SW_SUCCESS is 0x9000", () => {
    expect(SW_SUCCESS).toBe(0x9000);
  });

  it("PAGE_SIZE is 4", () => {
    expect(PAGE_SIZE).toBe(4);
  });

  it("ATR_MIN_LENGTH is 10", () => {
    expect(ATR_MIN_LENGTH).toBe(10);
  });
});

describe("ACR122_READER_PATTERN", () => {
  it("matches ACR122U reader names", () => {
    expect(ACR122_READER_PATTERN.test("ACS ACR122U PICC Interface")).toBe(true);
  });

  it("matches ACR1252U reader names", () => {
    expect(ACR122_READER_PATTERN.test("ACS ACR1252 1S CL Reader PICC Interface")).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(ACR122_READER_PATTERN.test("acr122")).toBe(true);
  });

  it("does not match unrelated reader names", () => {
    expect(ACR122_READER_PATTERN.test("Generic USB Reader")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tag data range mapping
// ---------------------------------------------------------------------------

describe("TAG_DATA_RANGE", () => {
  it("has entries for known NTAG types", () => {
    expect(TAG_DATA_RANGE[TagType.NTAG_213]).toBeDefined();
    expect(TAG_DATA_RANGE[TagType.NTAG_215]).toBeDefined();
    expect(TAG_DATA_RANGE[TagType.NTAG_216]).toBeDefined();
  });

  it("NTAG_213 has 36 pages starting at page 4", () => {
    const range = TAG_DATA_RANGE[TagType.NTAG_213]!;
    expect(range.startPage).toBe(4);
    expect(range.pageCount).toBe(36);
  });

  it("NTAG_215 has 126 pages starting at page 4", () => {
    const range = TAG_DATA_RANGE[TagType.NTAG_215]!;
    expect(range.startPage).toBe(4);
    expect(range.pageCount).toBe(126);
  });

  it("NTAG_216 has 222 pages starting at page 4", () => {
    const range = TAG_DATA_RANGE[TagType.NTAG_216]!;
    expect(range.startPage).toBe(4);
    expect(range.pageCount).toBe(222);
  });

  it("MIFARE_ULTRALIGHT has 12 pages starting at page 4", () => {
    const range = TAG_DATA_RANGE[TagType.MIFARE_ULTRALIGHT]!;
    expect(range.startPage).toBe(4);
    expect(range.pageCount).toBe(12);
  });

  it("has no entry for MIFARE_CLASSIC_1K (block-based, not page-based)", () => {
    expect(TAG_DATA_RANGE[TagType.MIFARE_CLASSIC_1K]).toBeUndefined();
  });

  it("has no entry for UNKNOWN tags", () => {
    expect(TAG_DATA_RANGE[TagType.UNKNOWN]).toBeUndefined();
  });

  it("has no entry for unsupported tag types (MIFARE_DESFIRE, FELICA, JCOP)", () => {
    expect(TAG_DATA_RANGE[TagType.MIFARE_DESFIRE]).toBeUndefined();
    expect(TAG_DATA_RANGE[TagType.FELICA]).toBeUndefined();
    expect(TAG_DATA_RANGE[TagType.JCOP_30]).toBeUndefined();
    expect(TAG_DATA_RANGE[TagType.JCOP_31]).toBeUndefined();
    expect(TAG_DATA_RANGE[TagType.TOPAZ_512]).toBeUndefined();
    expect(TAG_DATA_RANGE[TagType.MIFARE_PLUS]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// GET VERSION command and parsing
// ---------------------------------------------------------------------------

describe("CMD_GET_VERSION", () => {
  it("is the correct InCommunicateThru pseudo-APDU for GET_VERSION", () => {
    expect(CMD_GET_VERSION).toEqual(Buffer.from([0xff, 0x00, 0x00, 0x00, 0x03, 0xd4, 0x42, 0x60]));
  });
});

describe("parseGetVersion", () => {
  /**
   * Builds a GET_VERSION response data buffer (8 bytes).
   * [0]=header, [1]=vendor, [2]=productType, [3]=subType,
   * [4]=majorVer, [5]=minorVer, [6]=storageSize, [7]=protocol
   */
  function buildVersionData(productType: number, storageSize: number, vendor = 0x04): Buffer {
    return Buffer.from([0x00, vendor, productType, 0x01, 0x01, 0x00, storageSize, 0x03]);
  }

  it("identifies NTAG_213 (product=0x04, storage=0x0F)", () => {
    expect(parseGetVersion(buildVersionData(0x04, 0x0f))).toBe(TagType.NTAG_213);
  });

  it("identifies NTAG_215 (product=0x04, storage=0x11)", () => {
    expect(parseGetVersion(buildVersionData(0x04, 0x11))).toBe(TagType.NTAG_215);
  });

  it("identifies NTAG_216 (product=0x04, storage=0x13)", () => {
    expect(parseGetVersion(buildVersionData(0x04, 0x13))).toBe(TagType.NTAG_216);
  });

  it("identifies NTAG_210 (product=0x04, storage=0x06)", () => {
    expect(parseGetVersion(buildVersionData(0x04, 0x06))).toBe(TagType.NTAG_210);
  });

  it("identifies NTAG_212 (product=0x04, storage=0x0A)", () => {
    expect(parseGetVersion(buildVersionData(0x04, 0x0a))).toBe(TagType.NTAG_212);
  });

  it("identifies MIFARE_ULTRALIGHT_EV1 (product=0x03, storage=0x0B)", () => {
    expect(parseGetVersion(buildVersionData(0x03, 0x0b))).toBe(TagType.MIFARE_ULTRALIGHT_EV1);
  });

  it("identifies MIFARE_ULTRALIGHT_EV1 (product=0x03, storage=0x0E)", () => {
    expect(parseGetVersion(buildVersionData(0x03, 0x0e))).toBe(TagType.MIFARE_ULTRALIGHT_EV1);
  });

  it("returns null for unrecognized product/storage combo", () => {
    expect(parseGetVersion(buildVersionData(0x99, 0x99))).toBeNull();
  });

  it("returns null for data shorter than 7 bytes", () => {
    expect(parseGetVersion(Buffer.from([0x00, 0x04, 0x04, 0x01, 0x01, 0x00]))).toBeNull();
  });
});

describe("VERSION_TAG_TYPE_MAP", () => {
  it("has entries for all NTAG variants", () => {
    expect(VERSION_TAG_TYPE_MAP[0x0406]).toBe(TagType.NTAG_210);
    expect(VERSION_TAG_TYPE_MAP[0x040a]).toBe(TagType.NTAG_212);
    expect(VERSION_TAG_TYPE_MAP[0x040f]).toBe(TagType.NTAG_213);
    expect(VERSION_TAG_TYPE_MAP[0x0411]).toBe(TagType.NTAG_215);
    expect(VERSION_TAG_TYPE_MAP[0x0413]).toBe(TagType.NTAG_216);
  });

  it("has entries for MIFARE Ultralight EV1 variants", () => {
    expect(VERSION_TAG_TYPE_MAP[0x030b]).toBe(TagType.MIFARE_ULTRALIGHT_EV1);
    expect(VERSION_TAG_TYPE_MAP[0x030e]).toBe(TagType.MIFARE_ULTRALIGHT_EV1);
  });
});

// ---------------------------------------------------------------------------
// FAST_READ constants and command builder
// ---------------------------------------------------------------------------

describe("FAST_READ_TAG_TYPES", () => {
  it("includes all NTAG21x variants", () => {
    expect(FAST_READ_TAG_TYPES.has(TagType.NTAG_210)).toBe(true);
    expect(FAST_READ_TAG_TYPES.has(TagType.NTAG_212)).toBe(true);
    expect(FAST_READ_TAG_TYPES.has(TagType.NTAG_213)).toBe(true);
    expect(FAST_READ_TAG_TYPES.has(TagType.NTAG_215)).toBe(true);
    expect(FAST_READ_TAG_TYPES.has(TagType.NTAG_216)).toBe(true);
  });

  it("includes MIFARE Ultralight EV1", () => {
    expect(FAST_READ_TAG_TYPES.has(TagType.MIFARE_ULTRALIGHT_EV1)).toBe(true);
  });

  it("does NOT include plain MIFARE Ultralight", () => {
    expect(FAST_READ_TAG_TYPES.has(TagType.MIFARE_ULTRALIGHT)).toBe(false);
  });

  it("does NOT include MIFARE Ultralight C", () => {
    expect(FAST_READ_TAG_TYPES.has(TagType.MIFARE_ULTRALIGHT_C)).toBe(false);
  });

  it("does NOT include NTAG203", () => {
    expect(FAST_READ_TAG_TYPES.has(TagType.NTAG_203)).toBe(false);
  });

  it("does NOT include unsupported tag types", () => {
    expect(FAST_READ_TAG_TYPES.has(TagType.MIFARE_CLASSIC_1K)).toBe(false);
    expect(FAST_READ_TAG_TYPES.has(TagType.MIFARE_CLASSIC_4K)).toBe(false);
    expect(FAST_READ_TAG_TYPES.has(TagType.MIFARE_DESFIRE)).toBe(false);
    expect(FAST_READ_TAG_TYPES.has(TagType.FELICA)).toBe(false);
    expect(FAST_READ_TAG_TYPES.has(TagType.UNKNOWN)).toBe(false);
  });

  it("has exactly 6 entries", () => {
    expect(FAST_READ_TAG_TYPES.size).toBe(6);
  });
});

describe("FAST_READ_MAX_PAGES", () => {
  it("is 60", () => {
    expect(FAST_READ_MAX_PAGES).toBe(60);
  });

  it("fits within PN532 buffer (60 pages * 4 bytes = 240 < 262 usable)", () => {
    expect(FAST_READ_MAX_PAGES * PAGE_SIZE).toBeLessThanOrEqual(262);
  });
});

describe("buildFastReadCommand", () => {
  it("builds correct InCommunicateThru pseudo-APDU for FAST_READ", () => {
    const cmd = buildFastReadCommand(4, 39);
    expect(cmd).toEqual(
      Buffer.from([
        0xff,
        0x00,
        0x00,
        0x00,
        0x05, // Direct Transmit, Lc=5
        0xd4,
        0x42, // PN532 InCommunicateThru
        0x3a, // FAST_READ command
        0x04, // startPage
        0x27, // endPage (39 = 0x27)
      ]),
    );
  });

  it("builds correct command for single page (start == end)", () => {
    const cmd = buildFastReadCommand(4, 4);
    expect(cmd).toEqual(Buffer.from([0xff, 0x00, 0x00, 0x00, 0x05, 0xd4, 0x42, 0x3a, 0x04, 0x04]));
  });

  it("builds correct command for NTAG_215 full range (pages 4-129)", () => {
    const cmd = buildFastReadCommand(4, 129);
    expect(cmd).toEqual(Buffer.from([0xff, 0x00, 0x00, 0x00, 0x05, 0xd4, 0x42, 0x3a, 0x04, 0x81]));
  });

  it("builds correct command for page 0", () => {
    const cmd = buildFastReadCommand(0, 15);
    expect(cmd[8]).toBe(0x00); // startPage
    expect(cmd[9]).toBe(0x0f); // endPage
  });

  it("always has length 10", () => {
    expect(buildFastReadCommand(0, 0).length).toBe(10);
    expect(buildFastReadCommand(4, 129).length).toBe(10);
    expect(buildFastReadCommand(4, 63).length).toBe(10);
  });

  it("has Lc byte = 5 (5 bytes follow the header)", () => {
    const cmd = buildFastReadCommand(4, 39);
    expect(cmd[4]).toBe(0x05);
  });
});
