import ws from "ws";
import { initializeNFC, shutdownNFC } from "./pcsc.js";
import { TokenReaderNFC } from "./token-reader-nfc.js";

import type { WebSocketServer as WsServerType, WebSocket as WsClientType } from "ws";
import type { TokenStateNFC } from "./token-reader-nfc.js";

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

export function createServer(config: ServerConfig) {
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
  const shutdown = () => {
    console.log("Received shutdown signal");
    wss.close(() => {
      console.log("WebSocket server closed");
      shutdownNFC();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log(`Token reader server listening on ws://${config.host}:${config.port}`);
}

function broadcast(wss: InstanceType<typeof WebSocketServer>, message: StateMessage) {
  const data = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === ws.OPEN) {
      client.send(data);
    }
  }
}
