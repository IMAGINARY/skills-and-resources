import { Command } from "@commander-js/extra-typings";
import { parseNonNegativeInteger } from "./util";
import { serve } from "./serve";
import { list } from "./list";
import { monitor } from "./monitor";

const program = new Command()
  .name("token-reader")
  .description("NFC token reader WebSocket server")
  .showHelpAfterError();

program
  .command("list")
  .description("List connected readers and exit")
  .option("-t, --timeout <ms>", "Scan timeout in milliseconds", parseNonNegativeInteger, 2000)
  .action(async (opts) => {
    process.exitCode = await list(opts.timeout);
  });

program
  .command("serve")
  .description("Start the WebSocket server")
  .requiredOption("-i, --inventory <name>", "Inventory reader name")
  .requiredOption("-c, --challenge <name>", "Challenge reader name")
  .option("-H, --host <host>", "Host to bind", "localhost")
  .option("-p, --port <port>", "Port to bind", parseNonNegativeInteger, 5375)
  .action(async ({ host, port, inventory, challenge }) => {
    process.exitCode = await serve({ host, port, readers: { inventory, challenge } });
  });

program
  .command("monitor")
  .description("Connect to WebSocket server and echo messages")
  .option("-H, --host <host>", "Server host", "localhost")
  .option("-p, --port <port>", "Server port", parseNonNegativeInteger, 5375)
  .option("-r, --retry", "Reconnect when connection is closed", false)
  .action(async ({ host, port, retry }) => {
    process.exitCode = await monitor({ host, port, retry });
  });

program.parse();
