/**
 * ACR122UReader — extends AcsReader with ACR122U-only commands.
 *
 * Adds the standalone buzzer-on-detection toggle (`FF 00 52`) which
 * is only available on the ACR122U hardware — not on the ACR1252U's
 * compatibility layer.
 *
 * All shared commands (LED, firmware, PICC) are inherited from
 * {@link AcsReader}.
 */

import type { CardReader } from "./types.ts";
import { type Result, Ok, Err } from "./result.ts";
import { AcsReader } from "./AcsReader.ts";
import { ReaderClosedError, CardRemovedError, ControlError } from "./errors.ts";
import { buildSetBuzzerOnDetectionCommand } from "./constants.ts";

/**
 * Reader subclass for ACR122U hardware.
 *
 * Extends {@link AcsReader} with the standalone buzzer-on-detection
 * command (`FF 00 52`), which enables or disables the automatic beep
 * when a card enters the RF field.
 *
 * **Note:** This command is only supported on the ACR122U. The
 * ACR1252U does **not** support it through its ACR122U compatibility
 * layer. For ACR1252U-specific features, see `ACR1252UReader`.
 *
 * **Requires a card:** Like all ACS pseudo-APDU commands, this is
 * sent via `SCardTransmit` and will only succeed while a card is
 * present on the reader.
 */
export class ACR122UReader extends AcsReader {
  constructor(reader: CardReader) {
    super(reader);
  }

  // -----------------------------------------------------------------------
  // Buzzer on card detection (ACR122U-only)
  // -----------------------------------------------------------------------

  /**
   * Enables or disables the buzzer that sounds when a card is detected.
   *
   * By default, the ACR122U beeps once every time a card enters the RF
   * field. Call this method with `false` to silence that automatic beep.
   *
   * **Requires a card:** This command is a pseudo-APDU sent via
   * `SCardTransmit` and will only succeed while a card is present
   * on the reader.
   *
   * **Note:** This command is only supported on the ACR122U. The
   * ACR1252U's ACR122U compatibility layer does **not** support the
   * standalone buzzer command (`FF 00 52`). On unsupported readers, the
   * returned `Result` will contain a {@link ControlError}.
   *
   * @example
   * ```ts
   * // Silence the card-detection buzzer
   * const result = await reader.setBuzzerOnCardDetection(false);
   * if (!result.ok) console.error(result.error);
   *
   * // Re-enable it
   * await reader.setBuzzerOnCardDetection(true);
   * ```
   *
   * @param enabled - `true` to enable the buzzer on card detection
   *   (factory default), `false` to disable it.
   */
  async setBuzzerOnCardDetection(enabled: boolean): Promise<Result<void>> {
    if (this._closed) return Err(new ReaderClosedError(this.name));

    const cmd = buildSetBuzzerOnDetectionCommand(enabled);
    const result = await this.transmit(cmd);
    if (!result.ok) {
      if (result.error instanceof CardRemovedError) return result;
      return Err(
        new ControlError(`Failed to ${enabled ? "enable" : "disable"} buzzer on card detection`, {
          cause: result.error,
        }),
      );
    }

    return Ok(undefined);
  }

  override toString(): string {
    return `ACR122UReader(${this.name})`;
  }
}
