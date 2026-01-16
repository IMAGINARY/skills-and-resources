import * as errcodes from "./pcsclite-error-codes";

export function useNFC() {
  const nfc = window.api.nfc;

  nfc.on("reader", async (reader) => {
    console.log(reader);

    console.log(reader.name + " reader attached, waiting for cards ...");

    try {
      /*
       * edit
       *   /usr/lib/pcsc/drivers/ifd-acsccid.bundle/Contents/Info.plist
       *   /usr/lib/pcsc/drivers/ifd-ccid.bundle/Contents/Info.plist
       * and change ifdDriverOptions to 0x0001 to permit sending control commands to the reader
       */
      /*
        await reader.connect("CONNECT_MODE_DIRECT");
        await reader.setBuzzerOutput(false);
        console.log("Buzzer disabled");
        await reader.disconnect();

   */
    } catch (err) {
      console.info(`initial sequence error`, reader, err);
    }

    reader.on("card", (card) => {
      console.log(`${card.uid} appeared on reader ${reader.name}`);
    });

    reader.on("card.off", (card) => {
      console.log(`${card.uid} disappeared from reader ${reader.name}`);
    });

    reader.on("error", (err) => {
      const matches = /.*\((?<id>0x[0-9a-f]+)\)$/.exec(err);
      const errorCode = Number.parseInt(matches?.groups?.id ?? "-1", 16);
      switch (errorCode) {
        case errcodes.SCARD_E_SHARING_VIOLATION:
          console.warn(`${err}\nPlease remove the card from the reader and try again.`);
          break;
        case errcodes.SCARD_E_NO_SMARTCARD:
          console.warn(`${err}\nPlease reconnect the card to the reader.`);
          break;
        default:
          console.error(`reader error on ${reader.name}`, err);
      }
    });

    reader.on("end", () => {
      console.log(`${reader.name} reader disconnected.`);
    });
  });

  nfc.on("error", (err) => {
    console.error(err);
  });
}
