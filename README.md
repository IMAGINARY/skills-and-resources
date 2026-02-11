# Skills and Resources

Skills and Resources is an interactive exhibit about civil security
preparedness. Visitors use physical NFC tokens to identify as one of several
characters, each with unique skills and resources. Two side-by-side sub-apps
let them manage their character's inventory and tackle scenario-based
challenges (blackouts, storms, evacuations, etc.) to discover how personal
preparedness makes a difference.

## Architecture

The exhibit consists of two parts:

- **Web app** (Vue 3 + Vite): Renders a `ChallengeApp` and an `InventoryApp`
  side-by-side in a scaled letterbox layout (2 × 1080 × 1920).
- **Token reader tool** (Node.js CLI): Bridges physical NFC/PC/SC smart card
  readers to the web app via a WebSocket server.

## Options

Runtime options are configured in
[`src/options/options.yaml`](src/options/options.yaml). Options are currently
loaded at build time via `@modyfi/vite-plugin-yaml`; a future version will
support loading them at runtime.

- `languages.primary` (default: `"de"`): Primary display language
- `languages.secondary` (default: `"en"`): Secondary display language
- `websocketTokenReaderUrl` (default: `"ws://localhost:8382"`): URL of the
  token reader WebSocket server

## Configuration

The exhibit configuration is split into two YAML files, both loaded at build
time via `@modyfi/vite-plugin-yaml`:

- [`src/config/app.yaml`](src/config/app.yaml) — UI strings (section titles,
  descriptions, token prompt)
- [`src/config/content.yaml`](src/config/content.yaml) — exhibit content
  (items/skills/resources, character types, and challenges)

A JSON Schema for validating the configuration format is available at
[`specs/config.schema.json`](specs/config.schema.json). The configuration is
validated against this schema during startup. A
[third-party online viewer](https://json-schema.app/view/%23?url=https%3A%2F%2Fraw.githubusercontent.com%2FIMAGINARY%2Fskills-and-resources%2Frefs%2Fheads%2Fmain%2Fspecs%2Fconfig.schema.json)
for the schema is also available.

## Token Reader Tool

The token reader is a separate Node.js CLI tool in
[`tools/token-reader/`](tools/token-reader/) that bridges physical NFC/PC/SC
smart card readers to the web app via a WebSocket server. Install its
dependencies separately:

```bash
npm run fix-install --prefix tools/token-reader
```

Do not use the standard `npm install` unless you are using Node.js `>=20.20.0 <21`
(the native dependency`@pokusew/pcsclite` requires this version range to compile
without patching the source code). Using the special `fix-install` script will make
it work with newer Node.js versions, though (tested using Node.js 24.1).

Run it from the repository root via the convenience script:

```bash
npm run token-reader -- <command>
```

Available subcommands:

- `list`: List connected NFC readers and exit
- `serve`: Start the WebSocket server (requires `-i` and `-c` flags to specify
  the inventory and challenge reader names)
- `monitor`: Connect to the WebSocket server and echo messages
- `simulate`: Simulate token readers with a terminal UI (pass character
  uuid/name pairs as arguments)

Run `npm run token-reader -- --help` or
`npm run token-reader -- <command> --help` for detailed usage information.

## Preparing NFC Tags

The token reader tool currently only supports **NTAG21x** (NTAG 213/215/216)
NFC tags. Each tag represents one character and must be prepared as follows:

1. **Write an NDEF text record** containing the character type ID (e.g.
   `character_1`, `character_2`, …). The IDs must match the `characterTypes[].id`
   values in [`src/config/content.yaml`](src/config/content.yaml). The NDEF
   record must be of type `text` — no other record types are supported.

2. **Enable the NFC counter** (recommended). By reading the counter, it is
   possible to check whether a tag is approaching or has reached its end of
   life (NTAG21x tags are rated for 100 000 read operations). The NFC counter
   is controlled by bit 4 (`NFC_CNT_EN`) of the `ACCESS` configuration byte
   (byte 0 of page `2Ah` on NTAG213, `84h` on NTAG215, `E5h` on NTAG216).
   To enable it without overwriting other bits, first read the page with a
   `READ` command, set bit 4 in byte 0, and write the byte back:

   ```
   READ <ACCESS page>          # e.g. 30 2A for NTAG213
   # extract byte 0-3 of the 16 byte response
   # 00:05:00:00:00:00:00:... -> 00:05:00:00
   # set bit 4 (0x10) of byte 0, but keep other bits unchanged
   # 00:05:00:00 | 10:00:00:00 -> 01:05:00:00
   # write the modified byte back
   WRITE <ACCESS page> ...     # e.g. A2 2A <modified 4 bytes> for NTAG213
   ```

   Once enabled, the 24-bit counter can be read with the `READ_CNT` command
   (`39h`):

   ```
   39 02
   ```

   The reader returns 3 bytes representing the counter value in
   little-endian byte order.

   Please consult the [NTAG21x specification](https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf)
   for more details about the `READ`, `WRITE`, and `READ_CNT` commands as well
   as the `ACCESS` configuration byte and the `NFC_CNT_EN` bit.

3. **Enable password protection** (recommended). Setting a password makes the
   tag read-only for anyone who does not know the password. This prevents
   tech-savvy visitors from deleting or modifying the tag data using their
   smartphones.

On Android, the
[NFC Tools](https://play.google.com/store/apps/details?id=com.wakdev.wdnfc)
app can be used to write NDEF records and configure tag settings such as the
read counter and password protection. Note that the read counter can only be
enabled via the _Advanced NFC commands_, which may permanently damage the tag
when used incorrectly.

# Development

## Web App

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The following `npm run` scripts are available:

- `dev`: Start a development server with hot-reloading
- `build`: Type-check and build for production
- `preview`: Preview the production build locally
- `generate`: Run all generate scripts
- `generate:config-schema`: Generate JSON Schema from the TypeBox config schema
- `typecheck`: Run TypeScript type checking (`vue-tsc`)
- `lint`: Lint with oxlint
- `lint:fix`: Lint with auto-fix
- `format`: Format code with oxfmt

## Token Reader Tool

The token reader tool has its own `package.json` in
[`tools/token-reader/`](tools/token-reader/). Install the dependencies via

```bash
npm run fix-install
```

See the [Token Reader Tool](#token-reader-tool) section above for more details.

The following additional `npm
run` scripts are available within that directory:

- `typecheck`: Run TypeScript type checking
- `lint` / `lint:fix`: Lint with oxlint
- `format`: Format code with oxfmt

## Credits

Developed by Christian Stussak and Andrea Heilrath for IMAGINARY gGmbH.
Based on an idea by Eric Londaits.

## License

Copyright (c) 2026 IMAGINARY gGmbH, licensed under the MIT license (see
[`LICENSE`](LICENSE)).
