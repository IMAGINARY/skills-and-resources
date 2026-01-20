import { TokenReader } from "@renderer/token-reader/token-reader";
import { PscliteErrorCodes } from "@renderer/token-reader/pcsclite-error-codes";

import { CapabilityContainer } from "@johntalton/ndef";

import type { Reader as NFCReader } from "@tockawa/nfc-pcsc";
import type NFC from "@tockawa/nfc-pcsc";
import type { Token } from "@renderer/token-reader/token-reader";

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
      case PscliteErrorCodes.SCARD_E_SHARING_VIOLATION:
        console.warn(`${error}\nPlease remove the card from the reader and try again.`);
        break;
      case PscliteErrorCodes.SCARD_E_NO_SMARTCARD:
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

  protected token: Token | null = null;

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

        reader.on("card", async (card) => {
          // TODO: handle case where card.uid is undefined
          console.log(`${card.uid} appeared on reader ${reader.name}`);

          if (!card.uid)
            // TODO: notify user
            return;

          // a data page is 4 bytes long
          // data page 00: UUID
          // data page 01: UUID
          // data page 02: BCC1/INT./LOCK0-LOCK1
          // data page 03: 4 byte Capability Container (CC)
          // data page 04: Type Length Value (TLV): 1st byte: 0x03 (NDEF type), 2nd byte: length of NDEF message, 3rd & 4th byte: either extended length or NDEF data
          //
          // Password protect NTAG21x tag using NFC Tools (make read-only):
          // https://www.youtube.com/watch?v=rDgQgOpm8g8

          const ccLength = 4;
          const maxTlvLength = 4;
          // TODO: define reasonable limits for NDEF message size (must be safe for NTAG 213)
          const maxNdefMessageLength = 80;
          const length = ccLength + maxTlvLength + maxNdefMessageLength;
          const bytes = await reader.read(3, length);
          const cc = CapabilityContainer.decode(bytes);

          if (cc.message.records.length <= 1)
            // TODO: notify user
            return;

          const { recordType, data } = cc.message.records[0];
          if (recordType === "text") {
            const decoder = new TextDecoder();
            const cls = decoder.decode(data);
            this.token = { id: card.uid, class: cls };
            this.emit("update");
          }
        });

        reader.on("card.off", (card) => {
          console.log(`${card.uid} disappeared from reader ${reader.name}`, card);
          if (this.token !== null && this.token.id === card.uid) {
            // Some card readers seem able to connect to several cards simultaneously.
            // Ignore the event if the card that just disappeared is not the one we are currently
            // tracking.
            this.token = null;
            this.emit("update");
          }
        });

        reader.on("error", (err) => {
          handleReaderError(reader, err);
        });
      }
    });
  }

  public get currentToken(): Readonly<Token> | null {
    return this.token;
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
