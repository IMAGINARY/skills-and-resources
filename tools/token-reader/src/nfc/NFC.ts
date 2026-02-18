/**
 * NFC entry point — wraps the pcsclite native binding and provides
 * typed events for reader discovery with automatic Reader wrapping.
 */

import pcsclite from "@pokusew/pcsclite";
import { TypedEventEmitter } from "./TypedEventEmitter.ts";
import { type Result, Ok, Err } from "./result.ts";
import { Reader } from "./Reader.ts";
import { ACR122Reader } from "./ACR122Reader.ts";
import { ACR122_READER_PATTERN } from "./constants.ts";
import type { CardReader } from "./types.ts";

/** The top-level pcsclite instance type. */
type PCSCLite = ReturnType<typeof pcsclite>;

// ---------------------------------------------------------------------------
// Event map
// ---------------------------------------------------------------------------

/**
 * Event map for the NFC class.
 *
 * - `reader`: Emitted when a new PC/SC card reader is detected.
 *             Carries a {@link Reader} (or {@link ACR122Reader} for
 *             ACR122U / ACR1252U hardware).
 * - `error`:  Emitted when an error occurs in the underlying pcsclite layer.
 */
export interface NfcEventMap {
  reader: (reader: Reader) => void;
  error: (error: Error) => void;
  /** The underlying pcsclite instance was shut down. */
  end: () => void;
}

// ---------------------------------------------------------------------------
// NFC
// ---------------------------------------------------------------------------

/**
 * Entry point for NFC tag interaction.
 *
 * Wraps the pcsclite native binding and provides typed events
 * for reader discovery. When a hardware reader is detected, the
 * NFC class automatically wraps it in a {@link Reader} (or
 * {@link ACR122Reader} for ACR122U/ACR1252U devices) and emits
 * a `reader` event.
 *
 * @example
 * ```ts
 * const nfc = new NFC();
 *
 * nfc.on('reader', (reader) => {
 *   console.log('Reader detected:', reader.name);
 *
 *   reader.on('card', (card) => {
 *     console.log('Card UID:', card.uid);
 *     console.log('Card data:', card.data);
 *     console.log('Tag type:', card.type);
 *   });
 *
 *   reader.on('card.off', (card) => {
 *     console.log('Card removed:', card.uid);
 *   });
 * });
 *
 * nfc.on('error', (err) => {
 *   console.error('NFC error:', err.message);
 * });
 *
 * // When done:
 * nfc.close();
 * ```
 */
export class NFC extends TypedEventEmitter<NfcEventMap> {
  private pcsc: PCSCLite | null;
  private closed = false;

  /** Wrapped readers, keyed by reader name. */
  private _readers = new Map<string, Reader>();

  constructor() {
    super();
    this.pcsc = pcsclite();

    this.pcsc.on("reader", (rawReader: CardReader) => {
      const reader = this.wrapReader(rawReader);
      this._readers.set(reader.name, reader);

      // Remove the reader from the map when it disconnects.
      reader.on("end", () => {
        this._readers.delete(reader.name);
      });

      this.emit("reader", reader);
    });

    this.pcsc.on("error", (error: Error) => {
      this.emit("error", error);
    });

    // pcsclite extends EventEmitter and emits 'end' when shut down,
    // but the type definitions don't include it.
    (this.pcsc as NodeJS.EventEmitter).on("end", () => {
      // Auto-close to release all resources.
      // close() emits 'end' and handles cleanup.
      if (!this.closed) {
        this.close();
      }
    });
  }

  /**
   * Wraps a raw pcsclite CardReader in the appropriate Reader subclass.
   *
   * ACR122U and ACR1252U readers are detected by name and wrapped in
   * {@link ACR122Reader}; all others get a plain {@link Reader}.
   */
  private wrapReader(rawReader: CardReader): Reader {
    if (ACR122_READER_PATTERN.test(rawReader.name)) {
      return new ACR122Reader(rawReader);
    }
    return new Reader(rawReader);
  }

  /**
   * Returns the currently known readers as a read-only map keyed by
   * reader name.
   *
   * Returns an `Err` if this NFC instance has been closed.
   */
  get readers(): Result<ReadonlyMap<string, Reader>> {
    if (this.closed || this.pcsc === null) {
      return Err(new Error("NFC instance is closed"));
    }
    return Ok(this._readers);
  }

  /**
   * Releases all resources held by this NFC instance.
   *
   * After calling this method, no further events will be emitted
   * and all property/method access will return `Err` results.
   *
   * Returns an `Err` if already closed.
   */
  close(): Result<void> {
    if (this.closed || this.pcsc === null) {
      return Err(new Error("NFC instance is already closed"));
    }

    this.pcsc.close();
    this.pcsc = null;
    this.closed = true;
    this._readers.clear();
    this.emit("end");
    this.removeAllListeners();

    return Ok(undefined);
  }
}
