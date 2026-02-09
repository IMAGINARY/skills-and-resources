import { sleep } from "./util";
import { initializeNFC, shutdownNFC } from "./pcsc";
import type { NFCReader } from "./pcsc";

export async function list(timeout = 2000): Promise<number> {
  const pcsc = initializeNFC();
  let numReaders = 0;

  const newReaderCallback = (reader: NFCReader) => {
    ++numReaders;
    console.log(`  ${reader.name}`);
  };

  pcsc.on("reader", newReaderCallback);

  console.log("Scanning for readers...\n");

  await sleep(timeout);

  pcsc.off("reader", newReaderCallback);
  console.log(`\n${numReaders} reader(s) found.`);
  shutdownNFC();

  return 0;
}
