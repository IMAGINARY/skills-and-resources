import { describe, it, expect } from "vitest";
import {
  NfcError,
  ReaderClosedError,
  CardRemovedError,
  ConnectError,
  DisconnectError,
  TransmitError,
  ApduError,
  ReadError,
  WriteError,
  AuthError,
  UnsupportedTagError,
  ControlError,
} from "../../src/nfc/errors.ts";

describe("NfcError", () => {
  it("has correct name", () => {
    const err = new NfcError("test");
    expect(err.name).toBe("NfcError");
  });

  it("is an instance of Error", () => {
    const err = new NfcError("test");
    expect(err).toBeInstanceOf(Error);
  });

  it("carries the message", () => {
    const err = new NfcError("something went wrong");
    expect(err.message).toBe("something went wrong");
  });

  it("supports cause", () => {
    const cause = new Error("root cause");
    const err = new NfcError("wrapped", { cause });
    expect(err.cause).toBe(cause);
  });
});

describe("error hierarchy", () => {
  const errorClasses = [
    { Cls: ReaderClosedError, name: "ReaderClosedError", args: ["MyReader"] as const },
    { Cls: CardRemovedError, name: "CardRemovedError", args: ["MyReader"] as const },
    { Cls: ConnectError, name: "ConnectError", args: ["connect failed"] as const },
    { Cls: DisconnectError, name: "DisconnectError", args: ["disconnect failed"] as const },
    { Cls: TransmitError, name: "TransmitError", args: ["transmit failed"] as const },
    { Cls: ReadError, name: "ReadError", args: ["read failed"] as const },
    { Cls: WriteError, name: "WriteError", args: ["write failed"] as const },
    { Cls: AuthError, name: "AuthError", args: ["auth failed"] as const },
    { Cls: ControlError, name: "ControlError", args: ["control failed"] as const },
  ];

  for (const { Cls, name, args } of errorClasses) {
    describe(name, () => {
      it("extends NfcError", () => {
        const err = new Cls(...args);
        expect(err).toBeInstanceOf(NfcError);
      });

      it("extends Error", () => {
        const err = new Cls(...args);
        expect(err).toBeInstanceOf(Error);
      });

      it(`has name "${name}"`, () => {
        const err = new Cls(...args);
        expect(err.name).toBe(name);
      });
    });
  }
});

describe("ReaderClosedError", () => {
  it("includes reader name in message", () => {
    const err = new ReaderClosedError("ACR122U");
    expect(err.message).toContain("ACR122U");
  });

  it("has default message without reader name", () => {
    const err = new ReaderClosedError();
    expect(err.message).toBe("Reader is closed");
  });
});

describe("ApduError", () => {
  it("extends NfcError", () => {
    const err = new ApduError("bad status", 0x6300);
    expect(err).toBeInstanceOf(NfcError);
  });

  it("carries the status word", () => {
    const err = new ApduError("bad status", 0x6a82);
    expect(err.statusWord).toBe(0x6a82);
  });

  it("has correct name", () => {
    const err = new ApduError("bad", 0x0000);
    expect(err.name).toBe("ApduError");
  });

  it("supports cause", () => {
    const cause = new Error("underlying");
    const err = new ApduError("wrapped", 0x6300, { cause });
    expect(err.cause).toBe(cause);
  });
});

describe("UnsupportedTagError", () => {
  it("extends NfcError", () => {
    const err = new UnsupportedTagError("MIFARE_CLASSIC_1K");
    expect(err).toBeInstanceOf(NfcError);
  });

  it("extends Error", () => {
    const err = new UnsupportedTagError("MIFARE_CLASSIC_1K");
    expect(err).toBeInstanceOf(Error);
  });

  it("has correct name", () => {
    const err = new UnsupportedTagError("FELICA");
    expect(err.name).toBe("UnsupportedTagError");
  });

  it("includes the tag type in the message", () => {
    const err = new UnsupportedTagError("MIFARE_DESFIRE");
    expect(err.message).toContain("MIFARE_DESFIRE");
  });

  it("carries the tagType property", () => {
    const err = new UnsupportedTagError("UNKNOWN");
    expect(err.tagType).toBe("UNKNOWN");
  });
});

describe("CardRemovedError", () => {
  it("extends NfcError", () => {
    const err = new CardRemovedError("ACR122U");
    expect(err).toBeInstanceOf(NfcError);
  });

  it("extends Error", () => {
    const err = new CardRemovedError("ACR122U");
    expect(err).toBeInstanceOf(Error);
  });

  it("has correct name", () => {
    const err = new CardRemovedError();
    expect(err.name).toBe("CardRemovedError");
  });

  it("includes reader name in message", () => {
    const err = new CardRemovedError("ACR122U");
    expect(err.message).toContain("ACR122U");
  });

  it("has default message without reader name", () => {
    const err = new CardRemovedError();
    expect(err.message).toBe("Card was removed during operation");
  });

  it("supports cause", () => {
    const cause = new Error("SCardTransmit error (0x8010000c)");
    const err = new CardRemovedError("ACR122U", { cause });
    expect(err.cause).toBe(cause);
  });
});
