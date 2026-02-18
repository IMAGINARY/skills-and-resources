import { WebSocket, WebSocketServer } from "ws";
import { appShutdownPromise } from "./shutdown-signal.ts";

import type { Publisher } from "@mnasyrov/pubsub";

export type TokenId = string;
export type TokenClass = string;
export type Token = { id: TokenId; class: TokenClass };

export type TokenError<ErrorType, ErrorDetails> = {
  type: ErrorType;
  details: ErrorDetails;
};

export enum TokenStateType {
  ABSENT = "absent",
  READING = "reading",
  PRESENT = "present",
  ERROR = "error",
}

export type TokenState<TE extends TokenError<unknown, unknown>> =
  | { state: TokenStateType.ABSENT }
  | { state: TokenStateType.READING }
  | { state: TokenStateType.PRESENT; token: Token }
  | { state: TokenStateType.ERROR; error: TE };

export enum TokenErrorTypeNFC {
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  READ_INTERRUPTED = "READ_INTERRUPTED",
  DATA_INVALID = "DATA_INVALID",
}

export type TokenErrorDetailsNFC = string;

export type TokenErrorNFC = TokenError<TokenErrorTypeNFC, TokenErrorDetailsNFC>;

export type TokenStateNFC = TokenState<TokenErrorNFC>;

export type ReaderRole = "inventory" | "challenge";

export interface StateMessage {
  challenge: TokenStateNFC;
  inventory: TokenStateNFC;
}

export function createInitialState(): StateMessage {
  return {
    challenge: { state: TokenStateType.ABSENT },
    inventory: { state: TokenStateType.ABSENT },
  };
}

export interface ServeWebSocketOptions {
  host: string;
  port: number;
  onShutdown?: () => void | Promise<void>;
}

export async function serveWebSocket(
  options: ServeWebSocketOptions,
  stateMessagePublisher: Publisher<StateMessage>,
): Promise<number> {
  const { host, port } = options;
  const wss = new WebSocketServer({ host, port });

  let lastStateMessage: StateMessage = createInitialState();

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
    // Initiate WebSocket server shutdown
    const wssShutdownPromise = new Promise<void>((resolve, reject) =>
      wss.close((err: unknown) => {
        if (err) return reject(err);
        return resolve();
      }),
    );

    // Server stopped accepting new connections.
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
