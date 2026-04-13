# NTAG21x Protection: Low-Level Details

This document describes the hardware-level write-protection mechanisms of
NTAG21x (NTAG 213/215/216) tags, how _NFC Tools_ and _NXP TagWriter_ map to
them, and how to use both apps interchangeably.

For a user-facing summary, see the
[Locking and Password Protection](README.md#locking-and-password-protection-recommended)
section in the README.

## Two distinct mechanisms

NTAG21x tags have two write-protection mechanisms. **Do not confuse them** —
one is permanent and one is reversible.

### Permanent locking (lock bits)

OTP (one-time programmable) bits that make pages permanently read-only. Once
set, they can never be cleared — no password, no tool, no factory reset can
undo this. In _NFC Tools_, this is the "Lock tag" option (under "Other").
**Do not use it** unless you are certain the tag content is final and never
needs changing.

### Password protection (PWD/AUTH0/ACCESS)

A reversible 4-byte password mechanism. The tag remains freely readable, but
writing requires authentication. The password can be changed or removed at any
time by someone who knows the current password. This is what _NFC Tools_ calls
"Set password" and what _NXP TagWriter_ calls "Protect → Password protection".

## Hardware-level details

The NTAG21x configuration pages contain four relevant fields (page addresses
differ per variant — see the table below):

| Field    | Size                    | Description                                                                                                                                                                            |
| -------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH0`  | 1 byte (byte 3 of CFG0) | First page from which protection applies. Set to `04h` to protect all user data.                                                                                                       |
| `ACCESS` | 1 byte (byte 0 of CFG1) | Bit 7 (`PROT`): `0` = write-only protection (recommended), `1` = read+write protection (breaks NDEF readability). Bits 2-0 (`AUTHLIM`): max failed auth attempts (`000b` = unlimited). |
| `PWD`    | 4 bytes                 | The raw password. Default: `FF FF FF FF`.                                                                                                                                              |
| `PACK`   | 2 bytes                 | Password acknowledge, returned after successful auth. Default: `00 00`.                                                                                                                |

Configuration page addresses:

| Page          | NTAG213    | NTAG215     | NTAG216     |
| ------------- | ---------- | ----------- | ----------- |
| CFG0 (AUTH0)  | `29h` (41) | `83h` (131) | `E3h` (227) |
| CFG1 (ACCESS) | `2Ah` (42) | `84h` (132) | `E4h` (228) |
| PWD           | `2Bh` (43) | `85h` (133) | `E5h` (229) |
| PACK          | `2Ch` (44) | `86h` (134) | `E6h` (230) |

To authenticate, the reader sends a `PWD_AUTH` command (`1Bh`) with the
4-byte password. On success the tag returns the PACK value and grants write
access for the session.

## How NFC Tools handles passwords

_NFC Tools_ (by wakdev) accepts an **arbitrary text password** and derives the
raw 4-byte PWD via MD5 hashing:

1. Compute `MD5(password_string)` (16 bytes).
2. Bytes 0-3 of the MD5 hash become the **PWD**.
3. Bytes 4-5 of the MD5 hash become the **PACK**.
4. `AUTH0` is set to `04h` (protect all user data), `PROT` to `0`
   (write-only protection).

To remove the password, the app recomputes the MD5 from the text password,
authenticates, and resets `AUTH0` to `FFh`.

## How NXP TagWriter handles passwords

_NXP TagWriter_ takes the **raw 4-byte PWD as an 8-hex-character string** —
no hashing. For example, entering `06c219e5` writes the bytes `06 c2 19 e5`
directly to the `PWD` register. TagWriter does not expose `AUTH0`, `PROT`, or
`AUTHLIM` as separate settings; it sets them automatically behind the scenes
(write-only protection on all user data, unlimited retries).

## Using both apps interchangeably

_NFC Tools_ hashes an arbitrary text password with MD5 to derive PWD and
PACK; _TagWriter_ takes the raw hex PWD directly. To protect a tag with _NFC
Tools_ and later manage it with _TagWriter_, compute the MD5 yourself:

```
NFC Tools password: "mysecret"
MD5("mysecret"):    06c219e5bc8378f3a8a3f83b4b7e4649
PWD (bytes 0-3):    06c219e5   ← enter this in TagWriter
PACK (bytes 4-5):   bc83
```

On macOS: `echo -n "mysecret" | md5`. On Linux: `echo -n "mysecret" | md5sum`.

Enter the first 8 hex characters of the MD5 hash as the password in
_TagWriter_ to protect or unprotect a tag that was (or will be) managed by
_NFC Tools_. Note that the reverse direction is not possible: given only the
8 hex characters from _TagWriter_, you cannot recover the original _NFC
Tools_ text password because MD5 is a one-way hash.

## Cautions

- **`AUTHLIM`**: If set to a non-zero value (by a low-level tool) and the
  wrong password is sent too many times, the tag is **permanently bricked**
  for writes. Neither _NFC Tools_ nor _TagWriter_ exposes this setting
  directly; both default to unlimited retries. Leave it at `000b` (unlimited)
  unless brute-force protection is explicitly needed.
- **`PROT=1`** (read+write protection) makes the tag unreadable without
  authentication. Normal NFC phones and the exhibit reader will not be able
  to read the NDEF data. Always use `PROT=0` (write-only protection). Both
  _NFC Tools_ and _TagWriter_ default to write-only protection.
- **Password protection does not protect the UID.** The 7-byte serial number
  is always readable regardless of password settings.

## References

- [NTAG213/215/216 datasheet](https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf)
- [NXP TagWriter user manual](https://inspire.nxp.com/tagwriter/tag-writer-user-manual.pdf)
