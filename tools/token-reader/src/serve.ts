import ws from "ws";
import { initializeNFC, shutdownNFC } from "./pcsc";
import { TokenReaderNFC } from "./token-reader-nfc";

import type { WebSocketServer as WsServerType, WebSocket as WsClientType } from "ws";
import type { TokenStateNFC } from "./token-reader-nfc";

// Handle CJS/ESM interop - access Server from the default export at runtime
const WebSocketServer = (ws as unknown as { Server: typeof WsServerType }).Server;

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
  wss.on("connection", (client: WsClientType) => {
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
  const shutdown = async (): Promise<number> => {
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

  return await new Promise((resolve) => {
    const callback = async () => {
      const exitCode = await shutdown();
      process.off("SIGINT", callback);
      process.off("SIGTERM", callback);

      resolve(exitCode);
    };
    process.on("SIGINT", callback);
    process.on("SIGTERM", callback);
  });
}

function broadcast(wss: InstanceType<typeof WebSocketServer>, message: StateMessage) {
  const data = JSON.stringify(message);
  wss.clients
    .values()
    .filter((client) => client.readyState === ws.OPEN)
    .forEach((client) => client.send(data));
}
