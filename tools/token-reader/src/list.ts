import { sleep } from "./util";
import { NFC, Reader } from "./nfc/index.ts";

export async function list(timeout = 2000): Promise<number> {
  const nfc = new NFC();
  let numReaders = 0;

  const newReaderCallback = (reader: Reader) => {
    ++numReaders;
    console.log(`  ${reader.name}`);
  };

  nfc.on("reader", newReaderCallback);

  console.log("Scanning for readers...\n");

  await sleep(timeout);

  nfc.off("reader", newReaderCallback);
  console.log(`\n${numReaders} reader(s) found.`);
  nfc.close();

  return 0;
}
