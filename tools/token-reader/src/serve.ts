import { WebSocket, WebSocketServer } from "ws";
import { Emitter, Publisher } from "@mnasyrov/pubsub";
import { initializeNFC, shutdownNFC } from "./pcsc";
import { TokenReaderNFC } from "./token-reader-nfc";
import { appShutdownPromise } from "./shutdown-signal.ts";
import { TokenStateType } from "./token-reader.ts";

import type { TokenStateNFC } from "./token-reader-nfc";

type ReaderRole = "inventory" | "challenge";

export interface ServerConfig {
  host: string;
  port: number;
  readers: {
    inventory: string;
    challenge: string;
  };
}

interface StateMessage {
  challenge: TokenStateNFC;
  inventory: TokenStateNFC;
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

  const readerStates: StateMessage = {
    challenge: { state: TokenStateType.ABSENT },
    inventory: { state: TokenStateType.ABSENT },
  };

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

  return publisher;
}

async function serveWebSocket(
  { host, port }: { host: string; port: number },
  stateMessagePublisher: Publisher<StateMessage>,
): Promise<number> {
  const wss = new WebSocketServer({ host, port });

  let lastStateMessage: StateMessage = {
    challenge: { state: TokenStateType.ABSENT },
    inventory: { state: TokenStateType.ABSENT },
  };

  const subscription = stateMessagePublisher.subscribe((message) => {
    lastStateMessage = message;
    broadcast(wss, lastStateMessage);
  });

  // Handle new connections
  wss.on("connection", (client: WebSocket) => {
    console.log("Client connected");

    // Send last message to new client
    client.send(JSON.stringify(lastStateMessage));

    client.on("close", () => {
      console.log("Client disconnected");
    });
  });

  // Handle graceful shutdown
  const shutdownServer = async (): Promise<number> => {
    shutdownNFC();

    // Initiate WebSocket server shutdown
    const wssShutdownPromise = new Promise<void>((resolve, reject) =>
      wss.close((err: unknown) => {
        if (err) return reject(err);
        return resolve();
      }),
    );

    // Server stopped accepting new connection.
    // Close existing WebSocket clients.
    for (const client of wss.clients) client.close(1001);

    // Complete WebSocket server shutdown.
    await wssShutdownPromise.catch(console.error);

    subscription.unsubscribe();

    return 0;
  };

  console.log(`Token reader server listening on ws://${host}:${port}`);

  await appShutdownPromise;
  const exitCode = await shutdownServer();

  return exitCode;
}

function broadcast(wss: WebSocketServer, message: StateMessage) {
  const data = JSON.stringify(message);
  [...wss.clients]
    .filter((client) => client.readyState === WebSocket.OPEN)
    .forEach((client) => client.send(data));
}
