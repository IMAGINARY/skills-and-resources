import { sleep } from "./util.ts";

export interface MonitorConfig {
  host: string;
  port: number;
  retry: boolean;
}

export async function monitor(config: MonitorConfig): Promise<number> {
  const { host, port, retry } = config;
  const url = new URL(`ws://${host}:${port}`);

  do {
    const { exitCode, shouldRetry } = await connect(url);
    if (!retry || !shouldRetry) return exitCode;

    await sleep(1000);
  } while (retry);

  return 0;
}

type ConnectResult = { exitCode: number; shouldRetry: boolean };

function connect(url: URL): Promise<ConnectResult> {
  console.log(`Connecting to ${url}...`);
  const client = new WebSocket(url);

  return new Promise((resolve) => {
    let shouldRetry = true;
    const onOpen = () => console.log("Connected");
    const onMessage = (event: MessageEvent) => console.log(event.data);
    const onClose = () => {
      console.log("Connection closed");
      cleanup();
      resolve({ exitCode: 0, shouldRetry });
    };
    const onError = () => {
      console.error("Connection error");
      cleanup();
      resolve({ exitCode: 1, shouldRetry });
    };

    const cleanup = () => {
      client.removeEventListener("open", onOpen);
      client.removeEventListener("message", onMessage);
      client.removeEventListener("close", onClose);
      client.removeEventListener("error", onError);
    };

    client.addEventListener("open", onOpen);
    client.addEventListener("message", onMessage);
    client.addEventListener("close", onClose);
    client.addEventListener("error", onError);

    const shutdownSignals = ["SIGINT", "SIGTERM"];
    const shutdown = () => {
      shutdownSignals.forEach((signal) => process.off(signal, shutdown));
      shouldRetry = false;
      client.close();
    };

    shutdownSignals.forEach((signal) => process.on(signal, shutdown));
  });
}
