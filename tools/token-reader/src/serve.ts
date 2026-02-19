import type { Publisher } from "@mnasyrov/pubsub";
import { Emitter } from "@mnasyrov/pubsub";
import type { ReaderRole, StateMessage, Token } from "./state-server.ts";
import {
  createInitialState,
  serveWebSocket,
  TokenStateType,
  TokenStateNFC,
  TokenErrorTypeNFC,
} from "./state-server.ts";
import { ACR122Reader, CardRemovedError, Err, NFC, Ok, Reader, Result } from "./nfc/index.ts";
import { appShutdownPromise } from "./shutdown-signal.ts";

// @ts-expect-error No type declarations available
import { CapabilityContainer } from "@johntalton/ndef";
import { wrapException } from "./nfc/result.ts";
import { NfcForumType2TagCard } from "./nfc/types.ts";

export interface ServerConfig {
  host: string;
  port: number;
  readers: {
    inventory: string;
    challenge: string;
  };
}

export async function serve(config: ServerConfig): Promise<number> {
  const { host, port } = config;
  const stateMessagePublisher = createStateMessagePublisher(config.readers);
  return await serveWebSocket({ host, port }, stateMessagePublisher);
}

function createStateMessagePublisher(config: {
  challenge: string;
  inventory: string;
}): Publisher<StateMessage> {
  // Initialize NFC before creating readers
  const nfc = new NFC();

  const readerStates: StateMessage = createInitialState();

  const emitter = new Emitter<StateMessage>();
  const publisher: Publisher<StateMessage> = emitter;

  const handleReader = async (reader: Reader) => {
    console.log(`general: + reader ${reader.name} connected`);
    if (reader.name !== config.challenge && reader.name !== config.inventory) {
      console.warn(
        `general: ? reader ${reader.name} not matching inventory or challenge, ignoring`,
      );
      return;
    }

    const role: ReaderRole = reader.name === config.challenge ? "challenge" : "inventory";
    console.log(`${role}: # using reader ${reader.name}`);

    reader.once("end", () => {
      console.log(`${role}: - reader ${reader.name} disconnected`);
    });

    const emit = (state: TokenStateNFC) => {
      readerStates[role] = state;
      emitter.emit(structuredClone(readerStates));
    };

    reader.on("card.on", () => {
      console.log(`${role}: + card`);
      const state: TokenStateNFC = { state: TokenStateType.READING };
      emit(state);
    });

    let buzzerDisablingCompleted = false;
    let piccOperatingParameterSettingCompleted = false;
    reader.on("card", async (card: NfcForumType2TagCard) => {
      console.debug(
        `${role}: # uid: ${card.uid}, raw data (${card.data.length} bytes): ${card.data.toString()}`,
      );
      const decodeDataResult = decodeData(card.data);
      if (!decodeDataResult.ok) {
        console.error(`${role}: ! decode failed: ${decodeDataResult.error}`);
        emit({
          state: TokenStateType.ERROR,
          error: { type: TokenErrorTypeNFC.DATA_INVALID, details: decodeDataResult.error },
        });
        return;
      }

      const token: Token = { id: card.uid, class: decodeDataResult.value };
      console.log(`${role}: * uid: ${token.id}, class: ${token.class}`);
      emit({ state: TokenStateType.PRESENT, token });

      // Card has been read - reader should be idle
      // -> take care of buzzer muting and set PICC operating parameter
      {
        buzzerControl: if (!buzzerDisablingCompleted) {
          if (!(reader instanceof ACR122Reader)) {
            console.warn(`${role}: ? reader does not support buzzer disabling, skipping`);
            buzzerDisablingCompleted = true;
            break buzzerControl;
          }
          const acr122Reader: ACR122Reader = reader;
          const buzzerResult = await acr122Reader.setBuzzerOnCardDetection(false);
          if (!buzzerResult.ok) {
            console.warn(
              `${role}: ! buzzer disabling failed (will retry later): ${buzzerResult.error}`,
            );
            break buzzerControl;
          }

          console.log(`${role}: # buzzer disabled successfully`);
          buzzerDisablingCompleted = true;
        }

        piccControl: if (!piccOperatingParameterSettingCompleted) {
          // NOOP for now. Don't have cards for actually testing this.
          piccOperatingParameterSettingCompleted = true;
          break piccControl;
          /* Original code
          if (!(reader instanceof ACR122Reader)) {
            console.warn(
              `${role}: ? reader does not support setting PICC operating parameters, skipping`,
            );
            piccOperatingParameterSettingCompleted = true;
            break piccControl;
          }

          // Set up the reader to ignore tags other than ISO 14443-3A
          const result = await reader.setPiccOperatingParameter({
            autoPolling: true,
            autoAtsGeneration: true,
            shortPollingInterval: true,
            detectFelica424K: false,
            detectFelica212K: false,
            detectIso14443B: false, // = ISO 14443-4B
            detectIso14443A: false, // = ISO 14443-4A
            detectMifare: true, // = ISO 14443-3A (MIFARE / NTAG)
          });
          if (result.ok)
            console.log(`${role}: # reader configured exclusively for ISO 14443-3A tags`);
          else console.warn(`${role}: ! reader configuration failed: ${result.error}`);
          */
        }
      }
    });

    reader.on("card.off", () => {
      console.log(`${role}: - card`);
      const state: TokenStateNFC = { state: TokenStateType.ABSENT };
      emit(state);
    });

    reader.on("error", (error) => {
      console.error(`${role}: !`, error);
      if (error instanceof CardRemovedError) {
        emit({
          state: TokenStateType.ERROR,
          error: { type: TokenErrorTypeNFC.READ_INTERRUPTED, details: error.message },
        });
      } else {
        emit({
          state: TokenStateType.ERROR,
          error: { type: TokenErrorTypeNFC.UNKNOWN_ERROR, details: error.message },
        });
      }
    });
  };
  nfc.on("reader", handleReader);
  nfc.on("error", (error) => console.error("general: !", error));

  // TODO: handle NFC-level errors

  appShutdownPromise.then(() => {
    nfc.off("reader", handleReader);
    nfc.close();
  });

  return publisher;
}

function decodeData(bytes: Buffer<ArrayBufferLike>): Result<string, string> {
  const ccDecodeResult = wrapException(() => CapabilityContainer.decode(bytes));
  if (!ccDecodeResult.ok) return Err(`Could not decode NDEF message: ${ccDecodeResult.error}`);

  const cc = ccDecodeResult.value;

  if (cc.message.records.length < 1) return Err(`No NDEF Records found on card.`);

  const { recordType, data } = cc.message.records[0];
  if (recordType !== "text")
    return Err(`NDEF record type should be 'text', but is '${recordType}'.`);

  const decoder = new TextDecoder();

  try {
    return Ok(decoder.decode(data));
  } catch (decodeError) {
    return Err(`Could not decode NDEF text record: ${decodeError}`);
  }
}
