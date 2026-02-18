import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NFC } from "../../../src/nfc/NFC.ts";
import { Reader } from "../../../src/nfc/Reader.ts";
import { ACR122Reader } from "../../../src/nfc/ACR122Reader.ts";

/**
 * Hardware integration tests for the NFC class.
 *
 * These tests require a physical PC/SC reader to be available.
 * Run with: npm run test:hardware
 *
 * A single NFC instance is shared across all tests in this file
 * to avoid re-creating pcsclite contexts (which causes flaky
 * reader detection due to native layer timing).
 */
describe("NFC (hardware)", () => {
  let nfc: NFC;
  let detectedReader: Reader;

  beforeAll(async () => {
    nfc = new NFC();

    console.log(">>> Waiting for PC/SC reader (up to 30s)...");

    detectedReader = await new Promise<Reader>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timed out waiting for reader"));
      }, 30_000);

      nfc.on("reader", (reader) => {
        clearTimeout(timeout);
        resolve(reader);
      });

      nfc.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    console.log(`>>> Reader detected: ${detectedReader.name}`);

    // Swallow reader-level errors (e.g. UnsupportedTagError from an
    // unsupported tag on the reader). These tests only verify NFC-level
    // reader detection, not card reading.
    detectedReader.on("error", () => {});
  }, 35_000);

  afterAll(() => {
    nfc.close();
  });

  it("should detect a connected reader and wrap it in Reader", () => {
    expect(detectedReader).toBeDefined();
    expect(detectedReader).toBeInstanceOf(Reader);
    expect(typeof detectedReader.name).toBe("string");
    expect(detectedReader.name.length).toBeGreaterThan(0);

    // Check if ACR122 readers get the subclass
    if (/ACR122|ACR1252/i.test(detectedReader.name)) {
      expect(detectedReader).toBeInstanceOf(ACR122Reader);
      console.log(">>> Detected as ACR122Reader");
    }
  });

  it("should expose detected readers via the readers getter", () => {
    const result = nfc.readers;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeInstanceOf(Map);
      expect(result.value.size).toBeGreaterThan(0);
    }
  });

  it("should return Err from readers after close", () => {
    // Use a separate NFC instance for close testing
    const nfc2 = new NFC();

    const closeResult = nfc2.close();
    expect(closeResult.ok).toBe(true);

    const readersResult = nfc2.readers;
    expect(readersResult.ok).toBe(false);
    if (!readersResult.ok) {
      expect(readersResult.error.message).toContain("closed");
    }

    // Second close should also return Err
    const closeAgain = nfc2.close();
    expect(closeAgain.ok).toBe(false);
  });
});
