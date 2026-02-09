declare module "@tockawa/nfc-pcsc" {
  import { EventEmitter } from "events";

  export interface Card {
    atr: Buffer;
    standard: string;
    uid?: string;
    data?: Buffer;
  }

  type ReaderEvents = {
    card: Card;
    "card.off": Card;
    error: Error;
    end: void;
  };

  export class Reader extends EventEmitter {
    name: string;
    on<K extends keyof ReaderEvents>(event: K, listener: (v: ReaderEvents[K]) => void): this;
    once<K extends keyof ReaderEvents>(event: K, listener: (v: ReaderEvents[K]) => void): this;
    read(page: number, length: number): Promise<Buffer>;
    close(): void;
  }

  export class ACR122 extends Reader {}

  type PCSCEvents = {
    reader: ACR122 | Reader;
    error: Error;
  };

  export default class PCSC extends EventEmitter {
    constructor();
    on<K extends keyof PCSCEvents>(event: K, listener: (v: PCSCEvents[K]) => void): this;
    emit<K extends keyof PCSCEvents>(event: K, arg: PCSCEvents[K]): boolean;
    get readers(): unknown;
    close(): boolean;
  }
}
