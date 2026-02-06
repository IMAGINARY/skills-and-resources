import { Emitter } from "@mnasyrov/pubsub";
import { initializeNFC, shutdownNFC } from "./pcsc";
import { TokenReaderNFC } from "./token-reader-nfc";
import { serveWebSocket, createInitialState } from "./state-server.ts";

import type { Publisher } from "@mnasyrov/pubsub";
import type { ReaderRole, StateMessage } from "./state-server.ts";
import { appShutdownPromise } from "./shutdown-signal.ts";

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
  const pcsc = initializeNFC();

  const readerStates: StateMessage = createInitialState();

  const emitter = new Emitter<StateMessage>();
  const publisher: Publisher<StateMessage> = emitter;

  // Initialize readers
  const roles: ReaderRole[] = ["inventory", "challenge"];
  for (const role of roles) {
    const name = config[role];
    const reader = new TokenReaderNFC(pcsc, name);
    readerStates[role] = reader.currentToken;

    reader.on("update", () => {
      readerStates[role] = reader.currentToken;
      emitter.emit(structuredClone(readerStates));
    });

    console.log(`Waiting for reader: ${name} (${role})`);
  }

  appShutdownPromise.then(shutdownNFC);

  return publisher;
}
