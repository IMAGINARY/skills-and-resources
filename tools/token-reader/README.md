# Token Reader

NFC token reader that bridges physical PC/SC-compatible NFC readers to the web exhibit app via
WebSocket. Reads NFC Forum Type 2 Tags (NTAG/MIFARE Ultralight family), extracts a UID and NDEF
text record, and broadcasts token state as JSON to all connected WebSocket clients.

Supported readers: **ACS ACR122U** and **ACS ACR1252U**.

## Requirements

- Node.js `>=20.20.0 <21` (works with other version using `npm run fix-install`, see below)
- A PC/SC smart card service (`pcscd` on Linux, built-in on macOS/Windows)
- Dedicated ACS CCID drivers on Linux: `libacsccid1`

## Installation

```sh
npm install
```

### Fixing native dependency builds

The `@pokusew/pcsclite` package includes a native C++ addon. If the install fails or the native
module gets into a broken state (e.g. after a Node.js upgrade or interrupted install), use the
`fix-install` script:

```sh
npm run fix-install --prefix tools/token-reader
```

## Usage

Run from the repository root:

```sh
npm run start
```

The main entry point and all commands support the `-h/--help` flag.

### Commands

#### `list`

Scan for connected PC/SC readers and print their names.

```sh
npm run start -- list [-t, --timeout <ms>]
```

Use this to discover the exact reader names needed for the `serve` command.

#### `serve`

Start the WebSocket server that reads NFC tokens and broadcasts state.

```sh
npm run start -- serve -i <inventory-reader> -c <challenge-reader> [options]
```

| Option                     | Default      | Description                                     |
| -------------------------- | ------------ | ----------------------------------------------- |
| `-i, --inventory <name>`   | _(required)_ | PC/SC reader name for the inventory role        |
| `-c, --challenge <name>`   | _(required)_ | PC/SC reader name for the challenge role        |
| `-H, --host <host>`        | `localhost`  | WebSocket bind host                             |
| `-p, --port <port>`        | `8382`       | WebSocket bind port                             |
| `--buzzer` / `--no-buzzer` | —            | Enable/disable ACR122U buzzer on card detection |

Reader names can be partial matches. Use `list` to find the exact names.

#### `monitor`

Connect to a running WebSocket server and echo all messages to the terminal.

```sh
npm run start -- monitor [-H <host>] [-p <port>] [-r, --retry]
```

`--retry` enables automatic reconnection when the server disconnects.

#### `simulate`

Interactive terminal UI (Ink) that simulates placing tokens on readers without physical hardware.
Starts a WebSocket server simultaneously.

```sh
npm run start -- simulate <uuid1> <name1> [uuid2] [name2] ... [-H <host>] [-p <port>]
```

Arguments are uuid/name pairs defining the available simulated tokens.

### WebSocket Protocol

The server broadcasts a JSON `StateMessage` on every state change. New clients receive the last
known state on connect.

```json
{
  "challenge": {
    "state": "absent | reading | present | error",
    "token": { "id": "<uid-hex>", "class": "<ndef-text>" },
    "error": { "type": "<error-type>", "details": "..." }
  },
  "inventory": {
    "state": "absent | reading | present | error",
    "token": { "id": "<uid-hex>", "class": "<ndef-text>" },
    "error": { "type": "<error-type>", "details": "..." }
  }
}
```

`token` is present only when `state` is `"present"`. `error` is present only when `state` is
`"error"`.

## Buzzer Control

### ACR122U

The ACR122U has a software-controllable buzzer that beeps on card detection. Use the `--buzzer` /
`--no-buzzer` flags on the `serve` command to enable or disable it at runtime.

It requires a card to be present on the reader (the command is sent after the first successful card
read). The setting resets when the reader loses power.

### ACR1252U

The ACR1252U does not support ACR122U's buzzer control through its compatibility layer. Instead, buzzer
behavior is stored in **non-volatile memory** and can be configured with a one-time script, that direct
reader connection mode and therefore requires no card on the reader to work.

To disable the buzzer on all connected ACR1252U readers:

```sh
npm run disable-acr1252u-buzzer --prefix tools/token-reader
```

## Development

```sh
npm run typecheck        # TypeScript type checking
npm run lint             # Lint with oxlint
npm run lint:fix         # Lint with auto-fix
npm run format           # Format with oxfmt
npm test                 # Run unit tests
npm run test:hardware    # Run hardware integration tests (requires connected readers)
npm run test:watch       # Watch mode
```

Hardware tests are gated behind the `PCSC_TEST_HARDWARE` environment variable (set automatically
by the `test:hardware` script).
