/**
 * Error classes for the pcsc-nfc library.
 *
 * All errors extend a common `NfcError` base class so consumers
 * can catch broadly (`NfcError`) or narrowly (`TransmitError`).
 */

// ---------------------------------------------------------------------------
// Base error
// ---------------------------------------------------------------------------

/** Base class for all pcsc-nfc errors. */
export class NfcError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NfcError";
  }
}

// ---------------------------------------------------------------------------
// Reader lifecycle errors
// ---------------------------------------------------------------------------

/**
 * Thrown when an operation is attempted on a reader that has been
 * closed or whose underlying PC/SC resource has been freed.
 */
export class ReaderClosedError extends NfcError {
  constructor(readerName?: string) {
    super(readerName ? `Reader "${readerName}" is closed` : "Reader is closed");
    this.name = "ReaderClosedError";
  }
}

// ---------------------------------------------------------------------------
// Card removed
// ---------------------------------------------------------------------------

/**
 * Emitted when a card is physically removed from the reader while an
 * operation is in progress.
 *
 * This wraps the PC/SC `SCARD_E_NO_SMARTCARD` (`0x8010000C`) error
 * that the underlying pcsclite library returns when the card
 * disappears between a connect/transmit call and its completion.
 *
 * The original pcsclite error is attached as {@link Error.cause}.
 */
export class CardRemovedError extends NfcError {
  constructor(readerName?: string, options?: ErrorOptions) {
    super(
      readerName
        ? `Card was removed from "${readerName}" during operation`
        : "Card was removed during operation",
      options,
    );
    this.name = "CardRemovedError";
  }
}

// ---------------------------------------------------------------------------
// Connection errors
// ---------------------------------------------------------------------------

/**
 * Thrown when connecting to a card fails.
 * Wraps the underlying pcsclite error via `cause`.
 */
export class ConnectError extends NfcError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ConnectError";
  }
}

/**
 * Thrown when disconnecting from a card fails.
 */
export class DisconnectError extends NfcError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DisconnectError";
  }
}

// ---------------------------------------------------------------------------
// Transmit errors
// ---------------------------------------------------------------------------

/**
 * Thrown when an APDU transmit operation fails at the transport level.
 * The underlying pcsclite error is attached as `cause`.
 */
export class TransmitError extends NfcError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TransmitError";
  }
}

/**
 * Thrown when an APDU response contains a non-success status word.
 */
export class ApduError extends NfcError {
  /** The 2-byte status word from the response. */
  readonly statusWord: number;

  constructor(message: string, statusWord: number, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApduError";
    this.statusWord = statusWord;
  }
}

// ---------------------------------------------------------------------------
// Read / Write errors
// ---------------------------------------------------------------------------

/**
 * Thrown when a read operation fails.
 */
export class ReadError extends NfcError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ReadError";
  }
}

/**
 * Thrown when a write operation fails.
 */
export class WriteError extends NfcError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "WriteError";
  }
}

// ---------------------------------------------------------------------------
// Authentication errors
// ---------------------------------------------------------------------------

/**
 * Thrown when MIFARE Classic authentication fails.
 */
export class AuthError extends NfcError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AuthError";
  }
}

// ---------------------------------------------------------------------------
// Unsupported tag errors
// ---------------------------------------------------------------------------

/**
 * Emitted when a tag is detected whose type does not support
 * page-based data reading (e.g. MIFARE Classic, DESFire, FeliCa).
 *
 * The tag's UID is not read and no `card` event is emitted.
 * Consumers can inspect {@link tagType} to identify which tag
 * was placed on the reader.
 */
export class UnsupportedTagError extends NfcError {
  /** The detected tag type that is not supported. */
  readonly tagType: string;

  constructor(tagType: string) {
    super(`Unsupported tag type: ${tagType}`);
    this.name = "UnsupportedTagError";
    this.tagType = tagType;
  }
}

// ---------------------------------------------------------------------------
// Control errors
// ---------------------------------------------------------------------------

/**
 * Thrown when a PC/SC control command fails (e.g., ACR122U-specific
 * pseudo-APDUs sent via SCardControl).
 */
export class ControlError extends NfcError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ControlError";
  }
}
