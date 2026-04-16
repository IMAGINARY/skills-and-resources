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

For more details, see the [Token Reader README](tools/token-reader/README.md).

## NFC Tooling

Various apps are available for reading and writing NFC tags:

- [NFC Tools](https://www.wakdev.com/en/) (Android, iOS, Linux, macOS, Windows)
- [NFX TagWriter by NXP](https://www.nxp.com/design/design-center/software/rfid-developer-resources/nfc-tagwriter-app-by-nxp:NFC-TAGWRITER) (Android, iOS)
- [NFC TagInfo by NXP](https://www.nxp.com/design/design-center/software/rfid-developer-resources/the-nfc-taginfo-app-by-nxp:NFC-TAGINFO) (Android, iOS), reading only

Note that _NFC Tools_ supports user-defined low-level NFC commands (called _Advanced
NFC commands_ in the app). Use these commands with caution as they might permanently
lock or damage your NFC tags.

## Preparing NFC Tags

The token reader tool currently only supports **NTAG21x** (NTAG 213/215/216)
NFC tags. Each tag represents one character and must be prepared as described
in the following subsections.

### Writing the NDEF Text Record

Write an NDEF text record containing the character type ID (e.g.
`character_1`, `character_2`, …). The IDs must match the `characterTypes[].id`
values in [`src/config/content.yaml`](src/config/content.yaml). The NDEF
record must be of type `text` — no other record types are supported.

### Tag Durability

NTAG21x tags support a virtually unlimited number of contactless read
operations, so tag wear from normal exhibit use is not a concern. The write
endurance is specified at 100 000 cycles per page, but since tags are only
written during initial preparation (and occasionally re-written to update
content), the comparably few manual write operations will almost certainly
never approach this limit.

### Locking and Password Protection (Recommended)

NTAG21x tags have two distinct write-protection mechanisms — **do not confuse
them**:

- **Permanent locking** ("Lock tag" in _NFC Tools_ and _NXP TagWriter_): Makes the tag read-only
  forever. This is irreversible. **Do not use it** unless you are certain the
  tag content is final and never needs changing.

- **Password protection** ("Set password" in _NFC Tools_, "Protect → Password protection" in _NXP
  TagWriter_): Prevents writing without a password, but the tag remains freely
  readable. The password can be changed or removed at any time. **Use this**
  to prevent visitors from modifying the tag data with their smartphones.

#### Setting a password with NFC Tools

1. Open the tag in _NFC Tools_ and go to **Other → Set password**.
2. Enter any text password (e.g. `"mysecret"`). The app derives the raw
   hardware password from this text via MD5 hashing internally (first 4 bytes of the hash).
3. To remove or change the password later, you must enter the same text
   password.

#### Setting a password with NXP TagWriter

1. Open _NXP TagWriter_ and go to **Protect Tags → Password Protection**.
2. Enter the password as an **8-hex-character string** representing 4 raw
   bytes (e.g. `06d80eb0`) into the **New password** field.
3. To remove or change the password later, you must select **Remove Password** and enter the
   same hex string into the **Current password** field.

#### Using both apps on the same tag

Since _NFC Tools_ hashes the text password with MD5 internally, a tag
protected by _NFC Tools_ can be managed in _TagWriter_ by computing the MD5
yourself and entering the first 8 hex characters:

```
NFC Tools password: "mysecret"
MD5("mysecret"):    06c219e5bc8378f3a8a3f83b4b7e4649
TagWriter password: 06c219e5   (first 8 hex chars)
```

On macOS: `echo -n "mysecret" | md5`. On Linux: `echo -n "mysecret" | md5sum`.

The reverse is not possible: given only the hex password from _TagWriter_,
you cannot recover the original _NFC Tools_ text password because MD5 is a
one-way hash.

For hardware-level details (register layout, configuration page addresses,
`AUTH0`/`PROT`/`AUTHLIM` fields), see
[NTAG21x_PROTECTION.md](NTAG21x_PROTECTION.md).

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
