import { TokenReader } from "@renderer/token-reader/token-reader";
import * as errorCodes from "@renderer/token-reader/pcsclite-error-codes";

import type { Reader as NFCReader } from "@tockawa/nfc-pcsc";
import type NFC from "@tockawa/nfc-pcsc";
import type { TokenId } from "@renderer/token-reader/token-reader";

// TODO: make code datatype an enum. See https://www.typescriptlang.org/docs/handbook/enums.html
type PCSCLiteError = { message: string; functionName: string; code: number };

const errorRegex = /^(?<functionName>[\S]+) error: (?<message>.*)\((?<strCode>0x[0-9a-f]+)\)$/;
function parseErrorMessages(errorMessage: string): PCSCLiteError {
  const matches = errorRegex.exec(errorMessage);

  if (
    matches?.groups != null &&
    matches?.groups?.message != null &&
    matches?.groups?.functionName != null &&
    matches?.groups?.strCode != null
  ) {
    const { message, functionName, strCode } = matches.groups;
    const code = Number.parseInt(strCode, 16);

    return { message, functionName, code };
  }

  throw new Error(`Could not parse PCSCLite message: ${errorMessage}`);
}

function handleError(error: Error) {
  try {
    const { code } = parseErrorMessages(error.message);
    switch (code) {
      default:
        console.error(`NFC error`, error);
    }
  } catch (err) {
    console.error(`Unknown PCSCLite error format`, error, err);
  }
}

function handleReaderError(reader, error: Error) {
  try {
    const { code } = parseErrorMessages(error.message);
    switch (code) {
      case errorCodes.SCARD_E_SHARING_VIOLATION:
        console.warn(`${error}\nPlease remove the card from the reader and try again.`);
        break;
      case errorCodes.SCARD_E_NO_SMARTCARD:
        console.warn(`${error}\nPlease reconnect the card to the reader.`);
        break;
      default:
        console.error(`reader error on ${reader.name}`, error);
    }
  } catch (err) {
    console.error(`Unknown PCSCLite error format:`, error, err);
  }
}

export class TokenReaderNFC extends TokenReader {
  static nfc: NFC | null = null;

  protected id: TokenId | null = null;

  constructor(readerName: string) {
    super();
    const nfc = TokenReaderNFC.getNFC();
    nfc.on("reader", async (reader: NFCReader) => {
      if (reader.name === readerName) {
        console.log(`${reader.name} reader connected.`, reader);

        await TokenReaderNFC.applySettings(reader);
        reader.on("end", () => {
          console.log(`${reader.name} reader disconnected.`, reader);
        });

        reader.on("card", (card) => {
          // TODO: handle case where card.uuid is undefined
          console.log(`${card.uid} appeared on reader ${reader.name}`);
          this.id = card.uid ?? null;
          this.emit("update");
        });

        reader.on("card.off", (card) => {
          console.log(`${card.uid} disappeared from reader ${reader.name}`);
          if (this.id === card.uid) {
            // Some card readers seem able to connect to several cards simultaneously.
            // Ignore the event if the card that just disappeared is not the one we are currently
            // tracking.
            this.id = null;
            this.emit("update");
          }
        });

        reader.on("error", (err) => {
          handleReaderError(reader, err);
        });
      }
    });
  }

  public get currentToken(): TokenId | null {
    return this.id;
  }

  protected static getNFC(): NFC {
    if (TokenReaderNFC.nfc === null) {
      const nfc = window.api.nfc;
      nfc.on("error", handleError);
      TokenReaderNFC.nfc = nfc;
      return nfc;
    }

    return TokenReaderNFC.nfc;
  }

  protected static async applySettings(reader: NFCReader) {
    try {
      // TODO
      /*
       * edit
       *   /usr/lib/pcsc/drivers/ifd-acsccid.bundle/Contents/Info.plist
       *   /usr/lib/pcsc/drivers/ifd-ccid.bundle/Contents/Info.plist
       * and change ifdDriverOptions to 0x0001 to permit sending control commands to the reader
       */
      /*
        await reader.connect("CONNECT_MODE_DIRECT");
        await reader.buzzerControl(false); // @tockawa/nfc-pcsc
        // await reader.setBuzzerOutput(false); // @pokusew/nfc-pcsc
        console.log("Buzzer disabled");
        await reader.disconnect();
      */
    } catch (err) {
      console.info(`initial sequence error`, reader, err);
    }
  }
}
