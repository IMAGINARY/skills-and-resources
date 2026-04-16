/**
 * Disable the buzzer on an ACS ACR1252U reader.
 *
 * The ACR1252U stores buzzer and LED settings in non-volatile memory,
 * so this only needs to run once per reader.
 *
 * The acsccid1 driver is usually required for this to work. On Ubuntu, run
 * sudo apt install libacsccid1
 *
 * Specification:
 *   http://www.acs.com.hk/download-manual/13476/TSP-ACR1252U-2.02.pdf
 *   Section 5.4.5 (page 67)
 *
 * Usage:
 *   npx tsx scripts/disable-acr1252u-buzzer.ts
 */

import pcsclite from "@pokusew/pcsclite";

const pcsc = pcsclite();
const handlePCSCError = (err: any) => console.error("PC/SC error:", err);
pcsc.on("error", handlePCSCError);

const readers = [];

const handleReader = (reader) => {
  if (!/ACR1252/i.test(reader.name) || /SAM/i.test(reader.name)) {
    console.error("Not an ACR1252U PICC reader:", reader.name);
    return;
  }

  console.log(`Found reader: "${reader.name}"`);
  readers.push(reader);
};
pcsc.on("reader", handleReader);

await new Promise((resolve) => setTimeout(resolve, 1000));

pcsc.off("reader", handleReader);

for (const reader of readers) {
  await new Promise<void>((resolve, reject) => {
    console.log();
    console.log("Processing reader:", reader.name);
    // Connect in DIRECT mode (no card needed on reader)
    reader.connect({ share_mode: reader.SCARD_SHARE_DIRECT }, (err: any) => {
      if (err) reject(err);

      const controlCode = reader.SCARD_CTL_CODE(3500);
      const buzzerDisabled = 0b01111111 & 0b11000111; // default with buzzer bits 3-5 cleared

      // Set status indicator behavior: E0 00 00 21 01 <byte>
      const cmd = Buffer.from([0xe0, 0x00, 0x00, 0x21, 0x01, buzzerDisabled]);
      reader.control(cmd, controlCode, 260, (err: any, response: Buffer) => {
        if (err) reject(err);

        const hex = Array.from(response)
          .map((b: number) => b.toString(16).padStart(2, "0").toUpperCase())
          .join(" ");
        console.log("Result:", hex);

        resolve();
      });
    });
  });
}

console.log();
console.log("Done.");
process.exit(0); // pcsc.close() doesn't seem to work properly, so we jut exit the process
