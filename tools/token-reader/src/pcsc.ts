import NfcPcsc from "@tockawa/nfc-pcsc";
import type { Reader as NFCReader } from "@tockawa/nfc-pcsc";

// Handle CJS/ESM interop - PCSC class is nested in default.default
const PCSC = (NfcPcsc as unknown as { default: typeof NfcPcsc }).default ?? NfcPcsc;

// Track active NFC readers for cleanup
const nfcReaders = new Set<NFCReader>();
let nfc: InstanceType<typeof PCSC> | null = null;

export type { NFCReader };

export function initializeNFC(): InstanceType<typeof PCSC> {
  if (nfc !== null) {
    return nfc;
  }

  nfc = new PCSC();
  nfc.on("reader", (reader: NFCReader) => {
    nfcReaders.add(reader);
    reader.once("end", () => nfcReaders.delete(reader));
  });

  nfc.on("error", (error: Error) => {
    console.error("NFC error:", error);
  });

  return nfc;
}

export function shutdownNFC(): void {
  console.log("Shutting down NFC...");

  // Close all readers
  for (const reader of nfcReaders) {
    try {
      reader.close();
    } catch (err) {
      console.error(`Error closing reader ${reader.name}:`, err);
    }
  }
  nfcReaders.clear();

  // Close NFC instance
  if (nfc !== null) {
    try {
      nfc.close();
    } catch (err) {
      console.error("Error closing NFC:", err);
    }
    nfc = null;
  }
}
