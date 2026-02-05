import { Command } from "@commander-js/extra-typings";
import { createServer } from "./serve.ts";
import { listReaders } from "./list.ts";

const program = new Command()
  .name("token-reader")
  .description("NFC token reader WebSocket server")
  .showHelpAfterError();

program
  .command("list")
  .description("List connected readers and exit")
  .option("-t, --timeout <ms>", "Scan timeout in milliseconds", "2000")
  .action(async (opts) => {
    await listReaders(parseInt(opts.timeout, 10));
    process.exit(0);
  });

program
  .command("serve")
  .description("Start the WebSocket server")
  .requiredOption("-i, --inventory <name>", "Inventory reader name")
  .requiredOption("-c, --challenge <name>", "Challenge reader name")
  .option("-H, --host <host>", "Host to bind", "localhost")
  .option("-p, --port <port>", "Port to bind", "5375")
  .action((opts) => {
    createServer({
      host: opts.host,
      port: parseInt(opts.port, 10),
      readers: {
        inventory: opts.inventory,
        challenge: opts.challenge,
      },
    });
  });

program.parse();
