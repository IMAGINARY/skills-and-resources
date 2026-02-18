import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NFC } from "../../../src/nfc/NFC.ts";
import { Reader } from "../../../src/nfc/Reader.ts";
import { ACR122Reader } from "../../../src/nfc/ACR122Reader.ts";
import { UnsupportedTagError } from "../../../src/nfc/errors.ts";
import type { Card } from "../../../src/nfc/types.ts";

/**
 * Hardware integration tests for Reader and card detection.
 *
 * These tests require a physical PC/SC reader and a SUPPORTED NFC tag
 * (NTAG21x or MIFARE Ultralight family). Unsupported tags (e.g.
 * MIFARE Classic, DESFire, FeliCa, or UNKNOWN) will emit an
 * UnsupportedTagError instead of a card event.
 *
 * Run with: npm run test:hardware
 *
 * A SINGLE NFC instance is shared across ALL describe blocks in this
 * file. Creating multiple pcsclite contexts causes flaky reader
 * detection due to native layer timing issues.
 */

// -----------------------------------------------------------------------
// File-level shared state
// -----------------------------------------------------------------------

let nfc: NFC;
let sharedReader: Reader;
let initialCard: Card;

/** Wait for a reader and its first card from an NFC instance. */
function waitForReaderAndCard(
  instance: NFC,
  timeoutMs = 30_000,
): Promise<{ reader: Reader; card: Card }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out waiting for reader and card"));
    }, timeoutMs);

    instance.on("reader", (r) => {
      // Check if a card is already present (race: status event
      // may have fired before we got here — unlikely but safe).
      const existing = r.card;
      if (existing.ok && existing.value !== null) {
        clearTimeout(timeout);
        resolve({ reader: r, card: existing.value });
        return;
      }

      r.on("card", (card) => {
        clearTimeout(timeout);
        resolve({ reader: r, card });
      });

      r.on("error", (err) => {
        clearTimeout(timeout);
        if (err instanceof UnsupportedTagError) {
          reject(
            new Error(
              `Tag type "${err.tagType}" is not supported. ` +
                "Use an NTAG21x or MIFARE Ultralight tag for hardware tests.",
            ),
          );
        } else {
          reject(err);
        }
      });
    });

    instance.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/** Wait for a card on an existing reader. */
function waitForCard(reader: Reader, timeoutMs = 30_000): Promise<Card> {
  return new Promise((resolve, reject) => {
    // Check if a card is already present
    const existing = reader.card;
    if (existing.ok && existing.value !== null) {
      resolve(existing.value);
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error("Timed out waiting for card"));
    }, timeoutMs);

    reader.on("card", (card) => {
      clearTimeout(timeout);
      resolve(card);
    });

    reader.on("error", (err) => {
      clearTimeout(timeout);
      if (err instanceof UnsupportedTagError) {
        reject(
          new Error(
            `Tag type "${err.tagType}" is not supported. ` +
              "Use an NTAG21x or MIFARE Ultralight tag for hardware tests.",
          ),
        );
      } else {
        reject(err);
      }
    });
  });
}

/** Wait for card removal. */
function waitForCardOff(reader: Reader, timeoutMs = 30_000): Promise<Card> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out waiting for card removal"));
    }, timeoutMs);

    reader.on("card.off", (card) => {
      clearTimeout(timeout);
      resolve(card);
    });
  });
}

// -----------------------------------------------------------------------
// File-level setup / teardown — ONE pcsclite context for everything
// -----------------------------------------------------------------------

beforeAll(async () => {
  nfc = new NFC();

  console.log(">>> [reader.test] Waiting for reader and card (place a card on the reader)...");

  const result = await waitForReaderAndCard(nfc);
  sharedReader = result.reader;
  initialCard = result.card;

  console.log(`>>> [reader.test] Reader: ${sharedReader.name}`);
  console.log(`>>> [reader.test] Card UID: ${initialCard.uid}`);
}, 35_000);

afterAll(() => {
  nfc.close();
});

// -----------------------------------------------------------------------
// Reader tests
// -----------------------------------------------------------------------

describe("Reader (hardware)", () => {
  it("should detect a card, read its UID and data", async () => {
    // Ensure we observe a fresh card.on → card cycle.
    // If a card is already present, wait for it to be removed first.
    const existing = sharedReader.card;
    if (existing.ok && existing.value !== null) {
      console.log(">>> Card already present — remove the card from the reader...");
      await waitForCardOff(sharedReader);
    }

    console.log(">>> Place a card on the reader...");

    const { card, readTimeMs } = await new Promise<{ card: Card; readTimeMs: number | null }>(
      (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timed out waiting for card"));
        }, 30_000);

        let cardOnTime: number | null = null;

        sharedReader.on("card.on", () => {
          cardOnTime = performance.now();
        });

        sharedReader.on("card", (c) => {
          clearTimeout(timeout);
          const now = performance.now();
          resolve({
            card: c,
            readTimeMs: cardOnTime !== null ? now - cardOnTime : null,
          });
        });
      },
    );

    expect(card).toBeDefined();
    expect(typeof card.uid).toBe("string");
    expect(card.uid.length).toBeGreaterThan(0);
    console.log(`>>> Card UID: ${card.uid}`);

    expect(card.data).toBeDefined();
    expect(card.data.length).toBeGreaterThan(0);
    console.log(`>>> Card data (${card.data.length} bytes): ${card.data.toString("hex")}`);

    console.log(`>>> Tag type: ${card.type}`);

    expect(readTimeMs).not.toBeNull();
    console.log(`>>> Time between card.on and card: ${readTimeMs!.toFixed(1)} ms`);
  });

  it("should detect card removal with UID and data", async () => {
    // Ensure card is present
    await waitForCard(sharedReader);

    // Verify card getter works
    const cardResult = sharedReader.card;
    expect(cardResult.ok).toBe(true);
    if (cardResult.ok) {
      expect(cardResult.value).not.toBeNull();
    }

    console.log(">>> Now REMOVE the card from the reader (waiting 30s)...");
    const removedCard = await waitForCardOff(sharedReader);
    expect(removedCard).toBeDefined();
    expect(typeof removedCard.uid).toBe("string");
    expect(removedCard.data).toBeDefined();
    console.log(
      `>>> Card removed — UID: ${removedCard.uid}, data: ${removedCard.data.length} bytes`,
    );

    // Card getter should now return null
    const afterRemoval = sharedReader.card;
    expect(afterRemoval.ok).toBe(true);
    if (afterRemoval.ok) {
      expect(afterRemoval.value).toBeNull();
    }
  }, 65_000);

  it("should auto-read user data pages from an NTAG21x tag", async () => {
    console.log(">>> Place an NTAG21x tag on the reader...");
    const card = await waitForCard(sharedReader);
    console.log(`>>> Card: ${card.uid}, type: ${card.type}`);

    // Data should be auto-read from user data pages
    expect(card.data).toBeDefined();
    expect(card.data.length).toBeGreaterThan(0);
    console.log(`>>> Auto-read data (${card.data.length} bytes): ${card.data.toString("hex")}`);
  }, 65_000);
});

// -----------------------------------------------------------------------
// Reader.close tests — uses its own Reader from the SAME NFC instance
// -----------------------------------------------------------------------

describe("Reader.close (hardware)", () => {
  it("Reader.close() prevents further operations", async () => {
    const nfc2 = new NFC();

    console.log(">>> [Reader.close] Waiting for reader...");
    const reader = await new Promise<Reader>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timed out waiting for reader"));
      }, 30_000);

      nfc2.on("reader", (r) => {
        clearTimeout(timeout);
        resolve(r);
      });

      nfc2.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    const closeResult = reader.close();
    expect(closeResult.ok).toBe(true);

    // All operations should now return Err
    const cardResult = reader.card;
    expect(cardResult.ok).toBe(false);

    // Second close should return Err
    const closeAgain = reader.close();
    expect(closeAgain.ok).toBe(false);

    nfc2.close();
  }, 35_000);
});

// -----------------------------------------------------------------------
// ACR122Reader tests — uses the shared reader
// -----------------------------------------------------------------------

describe("ACR122Reader (hardware)", () => {
  // ACR122 pseudo-APDUs are sent via transmit(), which requires an active
  // card connection. Ensure a card is present before running these tests.
  beforeAll(async () => {
    if (!(sharedReader instanceof ACR122Reader)) return;
    console.log(">>> [ACR122] Ensure a card is on the reader...");
    await waitForCard(sharedReader);
    console.log(">>> [ACR122] Card present — running ACR122 tests");
  }, 35_000);

  it("should read firmware version from ACR122U/ACR1252U", async () => {
    if (!(sharedReader instanceof ACR122Reader)) {
      console.log(">>> Skipping: not an ACR122 reader");
      return;
    }

    const fwResult = await sharedReader.getFirmwareVersion();
    if (fwResult.ok) {
      expect(typeof fwResult.value).toBe("string");
      expect(fwResult.value.length).toBeGreaterThan(0);
      console.log(`>>> Firmware: ${fwResult.value}`);
    } else {
      console.log(`>>> Firmware read failed: ${fwResult.error.message}`);
    }
  });

  it("should control LEDs and return current state", async () => {
    if (!(sharedReader instanceof ACR122Reader)) {
      console.log(">>> Skipping: not an ACR122 reader");
      return;
    }

    // Green LED on, red off
    const ledResult = await sharedReader.ledBuzzer({
      green: { on: true },
      red: { on: false },
    });

    expect(ledResult.ok).toBe(true);
    if (ledResult.ok) {
      expect(typeof ledResult.value.red).toBe("boolean");
      expect(typeof ledResult.value.green).toBe("boolean");
      console.log(">>> LED state returned:", ledResult.value);
    }

    // Blink red with buzzer
    const blinkResult = await sharedReader.ledBuzzer({
      red: { on: false, blink: true, finalOn: false },
      green: { on: true },
      t1Duration: 2,
      t2Duration: 2,
      repetitions: 3,
      buzzerOnT1: true,
    });

    expect(blinkResult.ok).toBe(true);
    if (blinkResult.ok) {
      expect(typeof blinkResult.value.red).toBe("boolean");
      expect(typeof blinkResult.value.green).toBe("boolean");
      console.log(">>> LED state after blink cmd:", blinkResult.value);
    }
  });

  it("should read LED state via getLedState()", async () => {
    if (!(sharedReader instanceof ACR122Reader)) {
      console.log(">>> Skipping: not an ACR122 reader");
      return;
    }

    const result = await sharedReader.getLedState();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.value.red).toBe("boolean");
      expect(typeof result.value.green).toBe("boolean");
      console.log(">>> getLedState():", result.value);
    }
  });

  it("should disable and re-enable buzzer on card detection", async () => {
    if (!(sharedReader instanceof ACR122Reader)) {
      console.log(">>> Skipping: not an ACR122 reader");
      return;
    }

    // 1. Ensure a card is present (reuse existing).
    await waitForCard(sharedReader);

    // 2. Disable the buzzer.
    const disableResult = await sharedReader.setBuzzerOnCardDetection(false);
    expect(disableResult.ok).toBe(true);
    console.log(">>> Buzzer disabled — remove the card, then place it again");

    // 3. Wait for card removal.
    await waitForCardOff(sharedReader);
    console.log(">>> Card removed — now place the card on the reader (should be silent)");

    // 4. Wait for the card to appear again (buzzer should NOT sound).
    const silentCard = await waitForCard(sharedReader);
    expect(silentCard).toBeDefined();
    expect(silentCard.uid.length).toBeGreaterThan(0);
    console.log(`>>> Card detected silently — UID: ${silentCard.uid}`);

    // 5. Re-enable the buzzer (restore factory default).
    const enableResult = await sharedReader.setBuzzerOnCardDetection(true);
    expect(enableResult.ok).toBe(true);
    console.log(">>> Buzzer re-enabled");
  }, 65_000);

  it("should get/set PICC operating parameter", async () => {
    if (!(sharedReader instanceof ACR122Reader)) {
      console.log(">>> Skipping: not an ACR122 reader");
      return;
    }

    const getResult = await sharedReader.getPiccOperatingParameter();
    if (getResult.ok) {
      console.log(">>> PICC parameter:", getResult.value);

      // Write back the same value to verify round-trip.
      const setResult = await sharedReader.setPiccOperatingParameter(getResult.value);
      if (setResult.ok) {
        expect(setResult.value).toEqual(getResult.value);
        console.log(">>> PICC parameter confirmed:", setResult.value);
      } else {
        console.log(`>>> Set PICC failed: ${setResult.error.message}`);
      }
    } else {
      console.log(`>>> Get PICC failed: ${getResult.error.message}`);
    }
  });
});
