import { WebSocket, WebSocketServer } from "ws";
import { initializeNFC, shutdownNFC } from "./pcsc";
import { TokenReaderNFC } from "./token-reader-nfc";

import type { TokenStateNFC } from "./token-reader-nfc";
import { appShutdownPromise } from "./shutdown-signal.ts";

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
  reader: ReaderRole;
  state: TokenStateNFC;
}

export async function serve(config: ServerConfig): Promise<number> {
  // Initialize NFC before creating readers
  const pcsc = initializeNFC();

  const wss = new WebSocketServer({ host: config.host, port: config.port });
  const readerStates = new Map<ReaderRole, TokenStateNFC>();

  // Initialize readers
  const roles: ReaderRole[] = ["inventory", "challenge"];
  for (const role of roles) {
    const name = config.readers[role];
    const reader = new TokenReaderNFC(pcsc, name);
    readerStates.set(role, reader.currentToken);

    reader.on("update", () => {
      const state = reader.currentToken;
      readerStates.set(role, state);
      broadcast(wss, { reader: role, state });
    });

    console.log(`Waiting for reader: ${name} (${role})`);
  }

  // Handle new connections
  wss.on("connection", (client: WebSocket) => {
    console.log("Client connected");

    // Send current state of all readers
    for (const [reader, state] of readerStates) {
      const message: StateMessage = { reader, state };
      client.send(JSON.stringify(message));
    }

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

    return 0;
  };

  console.log(`Token reader server listening on ws://${config.host}:${config.port}`);

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
