/**
 * Core Reader class — wraps a pcsclite CardReader and provides
 * typed events for card detection with automatic UID and data reading.
 */

import { TypedEventEmitter } from "./TypedEventEmitter.ts";
import { type Result, Ok, Err } from "./result.ts";
import type { CardReader } from "./types.ts";
import type { Card } from "./types.ts";
import { TagType } from "./types.ts";
import {
  ReaderClosedError,
  CardRemovedError,
  ConnectError,
  DisconnectError,
  TransmitError,
  ApduError,
  ReadError,
  UnsupportedTagError,
} from "./errors.ts";
import {
  ReaderState,
  CMD_GET_DATA_UID,
  CMD_GET_VERSION,
  PAGE_SIZE,
  buildReadCommand,
  buildFastReadCommand,
  FAST_READ_TAG_TYPES,
  FAST_READ_MAX_PAGES,
  SW_SUCCESS,
  getStatusWord,
  getResponseData,
  DEFAULT_RESPONSE_MAX_LENGTH,
  parseAtr,
  parseGetVersion,
  TAG_DATA_RANGE,
} from "./constants.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detects the SCARD_W_RESET_CARD error (0x80100068).
 *
 * When the card is reset between connect() and transmit(), PC/SC
 * returns this error. The proper recovery is to reconnect and retry.
 */
function isCardResetError(error: Error): boolean {
  const msg = error.message + (error.cause instanceof Error ? error.cause.message : "");
  return msg.includes("0x80100068") || msg.toLowerCase().includes("card was reset");
}

/**
 * Detects the SCARD_E_NO_SMARTCARD error (0x8010000C).
 *
 * When the card is physically removed from the reader while an
 * operation is in progress, PC/SC returns this error. Unlike
 * SCARD_W_RESET_CARD, this is not recoverable — the card is gone.
 */
function isNoSmartcardError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message + (error.cause instanceof Error ? error.cause.message : "");
  return msg.toLowerCase().includes("0x8010000c") || msg.toLowerCase().includes("no smartcard");
}

// ---------------------------------------------------------------------------
// Event map
// ---------------------------------------------------------------------------

/** Events emitted by a {@link Reader}. */
export interface ReaderEventMap {
  /**
   * A card/tag was detected on the reader by PC/SC.
   * Emitted immediately when the reader hardware reports card presence,
   * before any connection, identification, or data reading takes place.
   */
  "card.on": () => void;
  /**
   * A card/tag was placed on the reader.
   * The Card object contains the UID and auto-read user data.
   */
  card: (card: Card) => void;
  /**
   * The card/tag was removed from the reader.
   * The Card object from the previous `card` event is passed
   * for reference (contains UID and data).
   */
  "card.off": (card: Card) => void;
  /** An error occurred on this reader. */
  error: (error: Error) => void;
  /** The reader was disconnected / removed from the system. */
  end: () => void;
}

// ---------------------------------------------------------------------------
// Reader
// ---------------------------------------------------------------------------

/**
 * Wraps a single pcsclite CardReader, providing:
 *
 * - Typed events for card arrival / removal / errors
 * - Automatic UID reading and data page reading on card detection
 *
 * When a card is placed on the reader, the Reader automatically:
 * 1. Connects to the card
 * 2. Reads the UID
 * 3. Determines the tag type from the ATR
 * 4. Reads the user data pages based on the tag type
 * 5. Emits a `card` event with the complete Card object
 *
 * When the card is removed, a `card.off` event is emitted with
 * the same Card object.
 *
 * Typically you don't construct this directly — the {@link NFC} class
 * creates Reader instances when hardware readers are detected.
 */
export class Reader extends TypedEventEmitter<ReaderEventMap> {
  /** The underlying pcsclite CardReader. */
  protected readonly reader: CardReader;
  /** The reader's name (e.g. "ACS ACR122U PICC Interface"). */
  readonly name: string;

  /** Currently active card, or null if no card is present. */
  private _card: Card | null = null;
  /** PC/SC protocol obtained during connect (T=0 or T=1). */
  private _protocol: number | null = null;
  /** Whether this Reader has been closed. */
  protected _closed = false;

  constructor(reader: CardReader) {
    super();
    this.reader = reader;
    this.name = reader.name;

    this.setupStatusHandler();
    this.setupErrorHandler();
    this.setupEndHandler();
  }

  // -----------------------------------------------------------------------
  // Getters
  // -----------------------------------------------------------------------

  /** The card currently on the reader, if any. */
  get card(): Result<Card | null> {
    if (this._closed) return Err(new ReaderClosedError(this.name));
    return Ok(this._card);
  }

  // -----------------------------------------------------------------------
  // Internal event wiring
  // -----------------------------------------------------------------------

  private setupStatusHandler(): void {
    this.reader.on("status", (status) => {
      const changes = (this.reader as any).state ^ status.state;
      if (changes === 0) return;

      // Card inserted
      if (changes & ReaderState.PRESENT && status.state & ReaderState.PRESENT) {
        this.emit("card.on");

        const atr = status.atr ?? Buffer.alloc(0);

        // Auto-connect, read UID and data.
        // Catch to prevent unhandled promise rejections — errors are
        // emitted via the 'error' event inside handleCardInserted.
        this.handleCardInserted(atr).catch((err) => {
          this.emit("error", err instanceof Error ? err : new Error(String(err)));
        });
      }

      // Card removed
      if (changes & ReaderState.EMPTY && status.state & ReaderState.EMPTY) {
        const previousCard = this._card;
        this._card = null;
        this._protocol = null;

        if (previousCard) {
          this.emit("card.off", previousCard);
        }
      }
    });
  }

  private setupErrorHandler(): void {
    this.reader.on("error", (err: Error) => {
      this.emit("error", err);
    });
  }

  private setupEndHandler(): void {
    this.reader.on("end", () => {
      // Auto-close the reader to release all resources.
      // close() emits 'end' and handles cleanup.
      if (!this._closed) {
        this.close();
      }
    });
  }

  /**
   * Called when a card is detected. Connects, identifies the tag type
   * (via ATR + optional GET VERSION refinement), reads the UID and
   * user data, then emits `card`.
   *
   * If the tag type is not supported for page-based data reading,
   * an `error` event is emitted with an {@link UnsupportedTagError}
   * and no `card` event fires.
   */
  private async handleCardInserted(atr: Buffer): Promise<void> {
    const connectResult = await this.connect();
    if (!connectResult.ok) {
      this.emit("error", connectResult.error);
      return;
    }

    // Identify the tag type (ATR + GET VERSION refinement)
    const tagType = await this.identifyTag(atr);

    // Reject tags without page-based data support
    const range = TAG_DATA_RANGE[tagType];
    if (!range) {
      this.emit("error", new UnsupportedTagError(tagType));
      return;
    }

    // Read UID
    const uidResult = await this.getUid();
    if (!uidResult.ok) {
      this.emit("error", uidResult.error);
      return;
    }

    // Read user data pages
    const dataResult = await this.readDataPages(tagType);
    if (!dataResult.ok) {
      this.emit("error", dataResult.error);
      return;
    }

    const card: Card = {
      uid: uidResult.value,
      data: dataResult.value,
      type: tagType,
    };

    this._card = card;
    this.emit("card", card);
  }

  // -----------------------------------------------------------------------
  // Tag identification
  // -----------------------------------------------------------------------

  /**
   * Identifies the tag type using ATR parsing, then attempts to refine
   * the result using the NXP GET_VERSION command (0x60).
   *
   * Many readers (e.g. ACR122U) report NTAG tags as generic
   * `MIFARE_ULTRALIGHT` in the ATR. GET_VERSION distinguishes NTAG
   * subtypes (213, 215, 216) and MIFARE Ultralight EV1 variants.
   *
   * If GET_VERSION fails (e.g. tag doesn't support it, or transmit
   * error), the ATR-based type is returned as a fallback.
   */
  private async identifyTag(atr: Buffer): Promise<TagType> {
    // Step 1: Parse ATR for initial tag type
    const { type: atrType } = parseAtr(atr);
    const baseType = atrType ?? TagType.UNKNOWN;

    // Step 2: Only attempt GET VERSION for MIFARE Ultralight-compatible
    // tags. These are the types where the ATR can't distinguish subtypes.
    if (
      baseType !== TagType.MIFARE_ULTRALIGHT &&
      baseType !== TagType.MIFARE_ULTRALIGHT_C &&
      baseType !== TagType.MIFARE_ULTRALIGHT_EV1
    ) {
      return baseType;
    }

    // Step 3: Send GET VERSION command (wrapped in PN532 InCommunicateThru)
    const versionResult = await this.transmit(CMD_GET_VERSION);
    if (!versionResult.ok) {
      // GET VERSION not supported — keep ATR-based type
      return baseType;
    }

    const response = versionResult.value;
    const sw = getStatusWord(response);
    if (sw !== SW_SUCCESS) {
      // Non-success status — tag doesn't support GET VERSION
      return baseType;
    }

    // Strip the PN532 response prefix (D5 43 <status>) and the SW bytes.
    // The response format from InCommunicateThru is:
    //   D5 43 <status> <payload...> 90 00
    // Where <status> = 0x00 means success.
    const rawData = getResponseData(response);
    if (rawData.length < 3 || rawData[0] !== 0xd5 || rawData[1] !== 0x43) {
      // Unexpected response format — keep ATR-based type
      return baseType;
    }

    const pn532Status = rawData[2];
    if (pn532Status !== 0x00) {
      // PN532 reported an error — keep ATR-based type
      return baseType;
    }

    // The actual GET_VERSION data starts after the 3-byte PN532 prefix
    const versionData = rawData.subarray(3);
    const refinedType = parseGetVersion(versionData);

    // If GET VERSION returned a recognized type, use it; otherwise
    // keep the ATR-based type.
    return refinedType ?? baseType;
  }

  // -----------------------------------------------------------------------
  // Low-level PC/SC operations (private, promise-wrapped)
  // -----------------------------------------------------------------------

  /**
   * Connects to the card on this reader using shared mode.
   * Stores the protocol for subsequent transmit calls.
   */
  private async connect(): Promise<Result<void>> {
    if (this._closed) return Err(new ReaderClosedError(this.name));

    return new Promise((resolve) => {
      try {
        this.reader.connect({ share_mode: this.reader.SCARD_SHARE_SHARED }, (err, protocol) => {
          if (err) {
            if (isNoSmartcardError(err)) {
              resolve(Err(new CardRemovedError(this.name, { cause: err })));
              return;
            }
            resolve(
              Err(new ConnectError(`Failed to connect to card on "${this.name}"`, { cause: err })),
            );
            return;
          }
          // When the reader is already connected, pcsclite calls cb()
          // with no protocol argument. In that case, keep the existing
          // protocol or default to T=1 (standard for contactless NFC).
          if (typeof protocol === "number") {
            this._protocol = protocol;
          } else if (this._protocol === null) {
            this._protocol = this.reader.SCARD_PROTOCOL_T1;
          }
          resolve(Ok(undefined));
        });
      } catch (err) {
        if (isNoSmartcardError(err)) {
          resolve(Err(new CardRemovedError(this.name, { cause: err })));
        } else {
          resolve(
            Err(new ConnectError(`Failed to connect to card on "${this.name}"`, { cause: err })),
          );
        }
      }
    });
  }

  /**
   * Disconnects from the current card.
   */
  private async disconnect(): Promise<Result<void>> {
    if (this._closed) return Err(new ReaderClosedError(this.name));

    return new Promise((resolve) => {
      try {
        this.reader.disconnect(this.reader.SCARD_LEAVE_CARD, (err) => {
          if (err) {
            resolve(
              Err(
                new DisconnectError(`Failed to disconnect from card on "${this.name}"`, {
                  cause: err,
                }),
              ),
            );
            return;
          }
          this._protocol = null;
          resolve(Ok(undefined));
        });
      } catch (err) {
        resolve(
          Err(
            new DisconnectError(`Failed to disconnect from card on "${this.name}"`, { cause: err }),
          ),
        );
      }
    });
  }

  /**
   * Transmits a raw APDU command to the card and returns the response.
   *
   * If the card was reset (SCARD_W_RESET_CARD, 0x80100068), the
   * method automatically reconnects and retries the command once.
   *
   * The caller is responsible for checking the status word in the response.
   */
  protected async transmit(
    command: Buffer,
    responseMaxLength: number = DEFAULT_RESPONSE_MAX_LENGTH,
  ): Promise<Result<Buffer>> {
    if (this._closed) return Err(new ReaderClosedError(this.name));

    const result = await this.transmitOnce(command, responseMaxLength);

    // SCARD_W_RESET_CARD — disconnect + reconnect, then retry once.
    // pcsclite's connect() short-circuits when this.connected is true,
    // so we must disconnect first to force a fresh SCardConnect call.
    if (!result.ok && isCardResetError(result.error)) {
      await this.disconnect(); // ignore error — we're recovering
      const reconnect = await this.connect();
      if (!reconnect.ok) return result; // return original error
      return this.transmitOnce(command, responseMaxLength);
    }

    return result;
  }

  /**
   * Single transmit attempt (no retry logic).
   */
  private async transmitOnce(command: Buffer, responseMaxLength: number): Promise<Result<Buffer>> {
    if (this._closed) return Err(new ReaderClosedError(this.name));

    const protocol = this._protocol;
    if (protocol === null || protocol === undefined) {
      return Err(new TransmitError("Not connected to a card"));
    }

    return new Promise((resolve) => {
      try {
        this.reader.transmit(command, responseMaxLength, protocol, (err, response) => {
          if (err) {
            if (isNoSmartcardError(err)) {
              resolve(Err(new CardRemovedError(this.name, { cause: err })));
              return;
            }
            resolve(Err(new TransmitError(`Transmit failed on "${this.name}"`, { cause: err })));
            return;
          }
          resolve(Ok(response));
        });
      } catch (err) {
        if (isNoSmartcardError(err)) {
          resolve(Err(new CardRemovedError(this.name, { cause: err })));
        } else {
          resolve(Err(new TransmitError(`Transmit failed on "${this.name}"`, { cause: err })));
        }
      }
    });
  }

  // -----------------------------------------------------------------------
  // UID
  // -----------------------------------------------------------------------

  /**
   * Reads the card's UID using the GET DATA APDU (FF CA 00 00 00).
   * Returns the UID as a hex string.
   */
  private async getUid(): Promise<Result<string>> {
    const result = await this.transmit(CMD_GET_DATA_UID);
    if (!result.ok) return result;

    const response = result.value;
    const sw = getStatusWord(response);

    if (sw !== SW_SUCCESS) {
      return Err(
        new ApduError(
          `GET DATA (UID) failed with status word 0x${sw.toString(16).padStart(4, "0")}`,
          sw,
        ),
      );
    }

    const uid = getResponseData(response).toString("hex");
    return Ok(uid);
  }

  // -----------------------------------------------------------------------
  // Data page reading
  // -----------------------------------------------------------------------

  /**
   * Reads user data pages from the tag based on the detected tag type.
   *
   * Uses the {@link TAG_DATA_RANGE} mapping to determine the correct
   * page range. For tag types that support FAST_READ (NTAG21x, MIFARE
   * Ultralight EV1), uses the bulk FAST_READ command via PN532
   * InCommunicateThru. Falls back to sequential READ BINARY APDUs for
   * tags that don't support FAST_READ (plain MIFARE Ultralight,
   * Ultralight C, NTAG203).
   *
   * Only called for tag types that have a known data range
   * (unsupported tags are rejected before reaching this method).
   */
  private async readDataPages(tagType: TagType): Promise<Result<Buffer>> {
    if (FAST_READ_TAG_TYPES.has(tagType)) {
      return this.readDataPagesFastRead(tagType);
    }
    return this.readDataPagesSequential(tagType);
  }

  /**
   * Reads user data pages using the NXP FAST_READ command (0x3A).
   *
   * FAST_READ reads a contiguous range of pages in a single command,
   * wrapped in a PN532 InCommunicateThru pseudo-APDU. For tags with
   * more pages than fit in the PN532 buffer ({@link FAST_READ_MAX_PAGES}),
   * multiple FAST_READ commands are issued.
   *
   * Response format from InCommunicateThru:
   *   D5 43 <status> <page data...> 90 00
   */
  private async readDataPagesFastRead(tagType: TagType): Promise<Result<Buffer>> {
    const range = TAG_DATA_RANGE[tagType]!;
    const { startPage, pageCount } = range;
    const endPage = startPage + pageCount - 1;
    const totalBytes = pageCount * PAGE_SIZE;

    try {
      const chunks: Buffer[] = [];
      let currentStart = startPage;

      while (currentStart <= endPage) {
        const currentEnd = Math.min(currentStart + FAST_READ_MAX_PAGES - 1, endPage);
        const cmd = buildFastReadCommand(currentStart, currentEnd);

        // FAST_READ returns (currentEnd - currentStart + 1) * 4 bytes
        // plus PN532 prefix (3 bytes) plus SW (2 bytes)
        const expectedPayload = (currentEnd - currentStart + 1) * PAGE_SIZE;
        const responseMaxLength = expectedPayload + 3 + 2;

        const result = await this.transmit(cmd, responseMaxLength);
        if (!result.ok) {
          // Let CardRemovedError propagate unwrapped so consumers can
          // distinguish card removal from generic read failures.
          if (result.error instanceof CardRemovedError) return result;
          return Err(
            new ReadError(`FAST_READ failed at pages ${currentStart}-${currentEnd}`, {
              cause: result.error,
            }),
          );
        }

        const response = result.value;
        const sw = getStatusWord(response);
        if (sw !== SW_SUCCESS) {
          return Err(
            new ReadError(
              `FAST_READ failed at pages ${currentStart}-${currentEnd} with status word 0x${sw.toString(16).padStart(4, "0")}`,
            ),
          );
        }

        // Strip SW bytes to get the PN532 response
        const rawData = getResponseData(response);

        // Validate PN532 InCommunicateThru response prefix: D5 43 <status>
        if (rawData.length < 3 || rawData[0] !== 0xd5 || rawData[1] !== 0x43) {
          return Err(
            new ReadError(
              `FAST_READ returned unexpected response format at pages ${currentStart}-${currentEnd}`,
            ),
          );
        }

        const pn532Status = rawData[2];
        if (pn532Status !== 0x00) {
          return Err(
            new ReadError(
              `FAST_READ PN532 error (status 0x${pn532Status.toString(16).padStart(2, "0")}) at pages ${currentStart}-${currentEnd}`,
            ),
          );
        }

        // Page data starts after the 3-byte PN532 prefix
        const pageData = rawData.subarray(3);
        chunks.push(pageData);

        currentStart = currentEnd + 1;
      }

      return Ok(Buffer.concat(chunks).subarray(0, totalBytes));
    } catch (err) {
      return Err(new ReadError("Unexpected error during FAST_READ", { cause: err }));
    }
  }

  /**
   * Reads user data pages sequentially using READ BINARY APDUs.
   *
   * This is the fallback method for tags that don't support FAST_READ
   * (plain MIFARE Ultralight, Ultralight C, NTAG203).
   */
  private async readDataPagesSequential(tagType: TagType): Promise<Result<Buffer>> {
    const range = TAG_DATA_RANGE[tagType]!;
    const { startPage, pageCount } = range;
    const totalBytes = pageCount * PAGE_SIZE;

    try {
      const chunks: Buffer[] = [];
      let remaining = totalBytes;
      let currentPage = startPage;

      while (remaining > 0) {
        const chunkSize = Math.min(remaining, PAGE_SIZE);

        const readCmd = buildReadCommand(currentPage, chunkSize);
        const readResult = await this.transmit(readCmd);
        if (!readResult.ok) {
          // Let CardRemovedError propagate unwrapped so consumers can
          // distinguish card removal from generic read failures.
          if (readResult.error instanceof CardRemovedError) return readResult;
          return Err(
            new ReadError(`Read failed at page ${currentPage}`, { cause: readResult.error }),
          );
        }

        const sw = getStatusWord(readResult.value);
        if (sw !== SW_SUCCESS) {
          return Err(
            new ReadError(
              `Read failed at page ${currentPage} with status word 0x${sw.toString(16).padStart(4, "0")}`,
            ),
          );
        }

        chunks.push(getResponseData(readResult.value));
        remaining -= chunkSize;
        currentPage++;
      }

      return Ok(Buffer.concat(chunks).subarray(0, totalBytes));
    } catch (err) {
      return Err(new ReadError("Unexpected error during read", { cause: err }));
    }
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Closes this reader and releases its resources.
   * After calling this, all methods return `Err(ReaderClosedError)`.
   */
  close(): Result<void> {
    if (this._closed) return Err(new ReaderClosedError(this.name));

    this.reader.close();
    this._closed = true;
    this._card = null;
    this._protocol = null;
    this.emit("end");
    this.removeAllListeners();

    return Ok(undefined);
  }

  override toString(): string {
    return `Reader(${this.name})`;
  }
}
