import { sleep } from "./util.ts";
import { appShutdownPromise } from "./shutdown-signal.ts";

export interface MonitorConfig {
  host: string;
  port: number;
  retry: boolean;
}

export async function monitor(config: MonitorConfig): Promise<number> {
  const { host, port, retry } = config;
  const url = new URL(`ws://${host}:${port}`);

  do {
    const { exitCode, shouldRetry } = await withConnection(url, (msg) => console.log(msg));
    if (!retry || !shouldRetry) return exitCode;

    await sleep(1000);
  } while (retry);

  return 0;
}

type ConnectResult = { exitCode: number; shouldRetry: boolean };

async function withConnection(url: URL, onMessage: (msg: unknown) => void): Promise<ConnectResult> {
  console.log(`Connecting to ${url}...`);
  const client = new WebSocket(url);
  let shouldRetry = true;
  let exitCode = 0;

  client.addEventListener("message", (event) => onMessage(event.data));

  try {
    await new Promise<void>((resolve) => {
      const onOpen = () => console.log("Connected");
      const onClose = () => {
        console.log("Connection closed");
        resolve();
      };
      const onError = (event: Event) => {
        console.error("Connection error", event);
        exitCode = 1;
        resolve();
      };

      client.addEventListener("open", onOpen, { once: true });
      client.addEventListener("close", onClose, { once: true });
      client.addEventListener("error", onError, { once: true });

      appShutdownPromise.then(() => {
        shouldRetry = false;
        client.close();
      });
    });
    // oxlint-disable-next-line no-unused-vars
  } catch (err) {
    exitCode = 1;
  }

  return { exitCode, shouldRetry };
}
