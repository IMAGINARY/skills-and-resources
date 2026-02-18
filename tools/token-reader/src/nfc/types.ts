/**
 * Types for the pcsc-nfc library.
 *
 * Covers card/tag representation, connection modes, authentication
 * parameters, and read/write options.
 */

import pcsclite from "@pokusew/pcsclite";

// ---------------------------------------------------------------------------
// Internal pcsclite types
// ---------------------------------------------------------------------------

// @pokusew/pcsclite uses `export =` so its interfaces (PCSCLite,
// CardReader) are not directly importable as named types.

/** The top-level pcsclite instance. */
type PCSCLite = ReturnType<typeof pcsclite>;

/**
 * A PC/SC card reader instance from the pcsclite binding.
 *
 * This is an internal type used by {@link Reader} and {@link NFC}
 * to interact with the native pcsclite layer. It is NOT part of
 * the public API — it is not re-exported from `index.ts`.
 *
 * Extracted from the pcsclite 'reader' event listener signature.
 */
export type CardReader = PCSCLite extends {
  on(type: "reader", listener: (reader: infer R) => void): any;
}
  ? R
  : never;

// ---------------------------------------------------------------------------
// Tag standards
// ---------------------------------------------------------------------------

/**
 * Known NFC tag standard identifiers, as determined from the ATR
 * (Answer To Reset) byte at offset 4 in the ACS tag type bytes.
 *
 * See ISO 14443 / FeliCa / various NFC Forum type specs.
 */
export const TAG_ISO_14443_3 = "TAG_ISO_14443_3" as const;
export const TAG_ISO_14443_4 = "TAG_ISO_14443_4" as const;

export type TagStandard = typeof TAG_ISO_14443_3 | typeof TAG_ISO_14443_4;

// ---------------------------------------------------------------------------
// Tag types (specific IC families)
// ---------------------------------------------------------------------------

/** Known NFC tag IC types, identified from ATR bytes. */
export const TagType = {
  MIFARE_CLASSIC_1K: "MIFARE_CLASSIC_1K",
  MIFARE_CLASSIC_4K: "MIFARE_CLASSIC_4K",
  MIFARE_ULTRALIGHT: "MIFARE_ULTRALIGHT",
  MIFARE_ULTRALIGHT_C: "MIFARE_ULTRALIGHT_C",
  MIFARE_ULTRALIGHT_EV1: "MIFARE_ULTRALIGHT_EV1",
  MIFARE_PLUS: "MIFARE_PLUS",
  MIFARE_DESFIRE: "MIFARE_DESFIRE",
  NTAG_203: "NTAG_203",
  NTAG_210: "NTAG_210",
  NTAG_212: "NTAG_212",
  NTAG_213: "NTAG_213",
  NTAG_215: "NTAG_215",
  NTAG_216: "NTAG_216",
  JCOP_30: "JCOP_30",
  JCOP_31: "JCOP_31",
  TOPAZ_512: "TOPAZ_512",
  FELICA: "FELICA",
  UNKNOWN: "UNKNOWN",
} as const;

export type TagType = (typeof TagType)[keyof typeof TagType];

// ---------------------------------------------------------------------------
// Card (tag on the reader)
// ---------------------------------------------------------------------------

/**
 * Represents a card/tag currently present on a reader.
 *
 * The `uid` is extracted via a GET_DATA APDU after the card is connected.
 * The `data` is auto-read from the tag's user data pages based on the
 * detected tag type.
 */
export interface Card {
  /** The tag's UID (4, 7, or 10 bytes) as a hex string. */
  uid: string;
  /** User data read from the tag's data pages. */
  data: Buffer;
  /** Detected tag IC type, if recognized. */
  type: TagType;
}

// ---------------------------------------------------------------------------
// ACR122 PICC operating parameter
// ---------------------------------------------------------------------------

/**
 * PICC operating parameter for ACR122U / ACR1252U readers.
 *
 * Each property corresponds to a single bit in the PICC parameter byte.
 * The factory default has all bits set (`0xFF` — all features enabled).
 *
 * **Warning:** Clearing {@link autoPolling} or {@link detectMifare} will
 * disable automatic detection of MIFARE / NTAG tags.
 */
export interface PiccOperatingParameter {
  /** Bit 7 — Automatic PICC polling. */
  autoPolling: boolean;
  /** Bit 6 — Automatic ATS generation (ISO 14443-4). */
  autoAtsGeneration: boolean;
  /** Bit 5 — Short polling interval (~250 ms when set, ~500 ms when cleared). */
  shortPollingInterval: boolean;
  /** Bit 4 — Detect FeliCa 424K tags. */
  detectFelica424K: boolean;
  /** Bit 3 — Detect FeliCa 212K tags. */
  detectFelica212K: boolean;
  /** Bit 2 — Detect ISO 14443-4B tags. */
  detectIso14443B: boolean;
  /** Bit 1 — Detect ISO 14443-4A tags. */
  detectIso14443A: boolean;
  /** Bit 0 — Detect ISO 14443-3A (MIFARE / NTAG) tags. */
  detectMifare: boolean;
}

// ---------------------------------------------------------------------------
// ACR122 LED / Buzzer
// ---------------------------------------------------------------------------

/**
 * Current LED state of the ACR122U reader.
 *
 * Returned by {@link ACR122Reader.ledBuzzer} and
 * {@link ACR122Reader.getLedState}. The values reflect the actual
 * hardware state reported by the reader's response byte:
 *
 * - Bit 0: Red LED (1 = on, 0 = off)
 * - Bit 1: Green LED (1 = on, 0 = off)
 */
export interface LedState {
  /** Red LED is currently on. */
  red: boolean;
  /** Green LED is currently on. */
  green: boolean;
}

/**
 * Configuration for the ACR122U LED+buzzer combo command (FF 00 40).
 *
 * All properties are optional. Omitting a LED object (e.g. leaving out
 * `red`) means the corresponding LED state is not updated by the
 * command. Omitting `on` within a LED object defaults the initial
 * state to off.
 */
export interface LedBuzzerOptions {
  /** Red LED configuration. Omit to leave the red LED unchanged. */
  red?: {
    /** Red LED initial state (on/off). Defaults to off if omitted. */
    on?: boolean;
    /** Red LED blinks during the T1/T2 cycle. */
    blink?: boolean;
    /** Red LED final state after blinking. */
    finalOn?: boolean;
  };
  /** Green LED configuration. Omit to leave the green LED unchanged. */
  green?: {
    /** Green LED initial state (on/off). Defaults to off if omitted. */
    on?: boolean;
    /** Green LED blinks during the T1/T2 cycle. */
    blink?: boolean;
    /** Green LED final state after blinking. */
    finalOn?: boolean;
  };
  /**
   * T1 duration (initial phase) in units of 100ms.
   * Range: 0x00–0xFF (0–25.5 seconds).
   */
  t1Duration?: number;
  /**
   * T2 duration (toggle phase) in units of 100ms.
   * Range: 0x00–0xFF (0–25.5 seconds).
   */
  t2Duration?: number;
  /** Number of blink repetitions. 0x00 = no blinking. */
  repetitions?: number;
  /** Buzzer sounds during T1 phase. */
  buzzerOnT1?: boolean;
  /** Buzzer sounds during T2 phase. */
  buzzerOnT2?: boolean;
}
