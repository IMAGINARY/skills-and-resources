import { initializeNFC, shutdownNFC } from "./pcsc.ts";
import type { NFCReader } from "./pcsc.ts";

export function listReaders(timeout = 2000): Promise<void> {
  return new Promise((resolve) => {
    const pcsc = initializeNFC();
    const readers: string[] = [];

    pcsc.on("reader", (reader: NFCReader) => {
      readers.push(reader.name);
      console.log(`  ${reader.name}`);
    });

    console.log("Scanning for readers...\n");

    setTimeout(() => {
      if (readers.length === 0) {
        console.log("  No readers found.");
      }
      console.log(`\n${readers.length} reader(s) found.`);
      shutdownNFC();
      resolve();
    }, timeout);
  });
}
