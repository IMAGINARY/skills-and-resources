/**
 * ACR122Reader — extends Reader with ACR122U-specific commands.
 *
 * Covers both the ACR122U and the ACR1252U (via its ACR122U
 * compatibility layer). Adds LED/buzzer control, firmware version
 * retrieval, and PICC operating parameter get/set.
 */

import type { CardReader } from "./types.ts";
import type { LedBuzzerOptions, LedState, PiccOperatingParameter } from "./types.ts";
import { type Result, Ok, Err } from "./result.ts";
import { Reader } from "./Reader.ts";
import { ReaderClosedError, CardRemovedError, ControlError } from "./errors.ts";
import {
  ACR122_CMD_GET_FIRMWARE,
  ACR122_CMD_GET_PICC,
  buildSetPiccCommand,
  buildSetBuzzerOnDetectionCommand,
  buildLedBuzzerCommand,
  parseLedStateByte,
  parsePiccParameter,
  buildPiccParameterByte,
} from "./constants.ts";

/**
 * Reader subclass for ACR122U and ACR1252U hardware.
 *
 * These readers support a set of pseudo-APDU commands for
 * controlling LEDs, buzzers, and PICC parameters. On the
 * ACR1252U, these commands are available through the ACR122U
 * compatibility layer.
 *
 * **Important:** All methods on this class are sent as pseudo-APDUs
 * via `SCardTransmit`, which requires an active card connection.
 * They will only succeed while a card is present on the reader.
 *
 * Supported commands:
 * - **LED + Buzzer** (FF 00 40): Combined LED state/blink and buzzer control
 * - **Get Firmware** (FF 00 48): Returns the reader's firmware version string
 * - **Get PICC** (FF 00 50): Reads the PICC operating parameter byte
 * - **Set PICC** (FF 00 51): Writes the PICC operating parameter byte
 * - **Set Buzzer on Detection** (FF 00 52): Enable/disable buzzer on card detection
 *
 * Note: The standalone buzzer command (FF 00 52) is NOT available
 * on the ACR1252U's compatibility layer.
 */
export class ACR122Reader extends Reader {
  constructor(reader: CardReader) {
    super(reader);
  }

  // -----------------------------------------------------------------------
  // Firmware version
  // -----------------------------------------------------------------------

  /**
   * Returns the reader's firmware version string.
   *
   * Example return value: `"ACR122U211"` or `"ACR1252U_V100"`.
   */
  async getFirmwareVersion(): Promise<Result<string>> {
    if (this._closed) return Err(new ReaderClosedError(this.name));

    const result = await this.transmit(ACR122_CMD_GET_FIRMWARE);
    if (!result.ok) {
      if (result.error instanceof CardRemovedError) return result;
      return Err(new ControlError("Failed to get firmware version", { cause: result.error }));
    }

    // The firmware version is returned as ASCII bytes (no status word).
    const firmware = result.value.toString("ascii").replace(/\0/g, "");
    return Ok(firmware);
  }

  // -----------------------------------------------------------------------
  // PICC operating parameter
  // -----------------------------------------------------------------------

  /**
   * Gets the current PICC operating parameter.
   *
   * The parameter controls polling behavior, ATS generation,
   * and which tag protocols the reader detects.
   *
   * @returns The current PICC operating parameter.
   */
  async getPiccOperatingParameter(): Promise<Result<PiccOperatingParameter>> {
    if (this._closed) return Err(new ReaderClosedError(this.name));

    const result = await this.transmit(ACR122_CMD_GET_PICC);
    if (!result.ok) {
      if (result.error instanceof CardRemovedError) return result;
      return Err(
        new ControlError("Failed to get PICC operating parameter", { cause: result.error }),
      );
    }

    // ACR122U pseudo-APDU response: [status_code, param_byte].
    // These do NOT use standard APDU status words (SW1 SW2).
    if (result.value.length < 2) {
      return Err(new ControlError(`Unexpected PICC response length: ${result.value.length}`));
    }

    return Ok(parsePiccParameter(result.value[1]));
  }

  /**
   * Sets the PICC operating parameter.
   *
   * **Warning:** Clearing {@link PiccOperatingParameter.autoPolling} or
   * {@link PiccOperatingParameter.detectMifare} will disable automatic
   * detection of MIFARE / NTAG tags.
   *
   * @param param - The new PICC operating parameter.
   * @returns The actual parameter confirmed by the reader.
   */
  async setPiccOperatingParameter(
    param: PiccOperatingParameter,
  ): Promise<Result<PiccOperatingParameter>> {
    if (this._closed) return Err(new ReaderClosedError(this.name));

    const cmd = buildSetPiccCommand(buildPiccParameterByte(param));
    const result = await this.transmit(cmd);
    if (!result.ok) {
      if (result.error instanceof CardRemovedError) return result;
      return Err(
        new ControlError("Failed to set PICC operating parameter", { cause: result.error }),
      );
    }

    // ACR122U pseudo-APDU response: [status_code, param_byte].
    if (result.value.length < 2) {
      return Err(new ControlError(`Unexpected PICC response length: ${result.value.length}`));
    }

    return Ok(parsePiccParameter(result.value[1]));
  }

  // -----------------------------------------------------------------------
  // Buzzer on card detection
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

  // -----------------------------------------------------------------------
  // LED and buzzer control
  // -----------------------------------------------------------------------

  /**
   * Controls the ACR122U's LEDs and buzzer.
   *
   * The ACR122U has two LEDs (red and green) and a piezo buzzer.
   * This command can set LED states, configure blink patterns,
   * and trigger the buzzer — all in a single command.
   *
   * The returned {@link LedState} reflects the **current** LED state
   * as reported by the reader after the command completes.
   *
   * **Requires a card:** This command is a pseudo-APDU sent via
   * `SCardTransmit` and will only succeed while a card is present
   * on the reader.
   *
   * @example
   * ```ts
   * // Turn on green LED, buzzer beep
   * const result = await reader.ledBuzzer({
   *   green: { on: true },
   *   red: { on: false },
   *   buzzerOnT1: true,
   *   t1Duration: 1,
   *   repetitions: 1,
   * });
   * if (result.ok) {
   *   console.log(result.value); // current LED state
   * }
   *
   * // Read the current state without changing it
   * const state = await reader.getLedState();
   * ```
   *
   * @param options - LED and buzzer configuration. Defaults to a
   *   no-op that reads the current LED state without changing it.
   * @returns The current LED state as reported by the reader.
   */
  async ledBuzzer(options: LedBuzzerOptions = {}): Promise<Result<LedState>> {
    if (this._closed) return Err(new ReaderClosedError(this.name));

    const {
      red,
      green,
      t1Duration = 0,
      t2Duration = 0,
      repetitions = 0,
      buzzerOnT1 = false,
      buzzerOnT2 = false,
    } = options;

    // Build the P2 (LED state) byte:
    // Bit 0: Red LED initial state
    // Bit 1: Green LED initial state
    // Bit 2: Red LED blink mask
    // Bit 3: Green LED blink mask
    // Bit 4: Red LED final state (after blink)
    // Bit 5: Green LED final state (after blink)
    // Bit 6: Red LED state update (1 = update)
    // Bit 7: Green LED state update (1 = update)
    let ledState = 0;

    if (red) {
      ledState |= 0x40; // Update red LED state
      if (red.on) ledState |= 0x01;
      if (red.blink) ledState |= 0x04;
      if (red.finalOn) ledState |= 0x10;
    }

    if (green) {
      ledState |= 0x80; // Update green LED state
      if (green.on) ledState |= 0x02;
      if (green.blink) ledState |= 0x08;
      if (green.finalOn) ledState |= 0x20;
    }

    // Buzzer byte: bit 0 = buzzer during T1, bit 1 = buzzer during T2
    let buzzerBits = 0;
    if (buzzerOnT1) buzzerBits |= 0x01;
    if (buzzerOnT2) buzzerBits |= 0x02;

    const cmd = buildLedBuzzerCommand(ledState, t1Duration, t2Duration, repetitions, buzzerBits);

    const result = await this.transmit(cmd);
    if (!result.ok) {
      if (result.error instanceof CardRemovedError) return result;
      return Err(new ControlError("LED/buzzer command failed", { cause: result.error }));
    }

    // ACR122U pseudo-APDU response: [status_code, led_state_byte].
    // SW2 contains the current LED state (bit 0 = red, bit 1 = green).
    if (result.value.length < 2) {
      return Err(new ControlError(`Unexpected LED/buzzer response length: ${result.value.length}`));
    }

    return Ok(parseLedStateByte(result.value[1]));
  }

  /**
   * Reads the current LED state without changing it.
   *
   * This is a convenience wrapper around {@link ledBuzzer} that sends
   * a no-op command (no LED state update bits set, no buzzer). The
   * ACR122U always reports the current LED state in its response.
   *
   * **Requires a card:** This command is a pseudo-APDU sent via
   * `SCardTransmit` and will only succeed while a card is present
   * on the reader.
   *
   * @example
   * ```ts
   * const result = await reader.getLedState();
   * if (result.ok) {
   *   console.log(result.value); // { red: true, green: false }
   * }
   * ```
   *
   * @returns The current LED state.
   */
  async getLedState(): Promise<Result<LedState>> {
    return this.ledBuzzer({});
  }

  override toString(): string {
    return `ACR122Reader(${this.name})`;
  }
}
