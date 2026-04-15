/**
 * ACR1252UReader — extends AcsReader for ACR1252U hardware.
 *
 * Currently a minimal subclass that inherits all shared pseudo-APDU
 * commands from {@link AcsReader} (firmware, PICC, LED+buzzer via the
 * ACR122U compatibility layer).
 *
 * Future: add native ACR1252U escape commands (`SCardControl` with
 * `E0 00 00 xx` class byte) for card-independent LED/buzzer/antenna
 * control.
 */

import type { CardReader } from "./types.ts";
import { AcsReader } from "./AcsReader.ts";

/**
 * Reader subclass for ACR1252U hardware.
 *
 * Inherits shared ACS pseudo-APDU commands from {@link AcsReader}:
 * firmware version, PICC operating parameter, and LED+buzzer control
 * (all via the ACR122U compatibility layer, requiring an active card).
 *
 * **Note:** The standalone buzzer-on-detection command (`FF 00 52`)
 * is NOT available on this reader. See {@link ACR122UReader} for that
 * ACR122U-only feature.
 */
export class ACR1252UReader extends AcsReader {
  constructor(reader: CardReader) {
    super(reader);
  }

  override toString(): string {
    return `ACR1252UReader(${this.name})`;
  }
}
