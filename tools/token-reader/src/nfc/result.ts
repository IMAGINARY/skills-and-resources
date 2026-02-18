/**
 * A discriminated union representing either a successful value or an error.
 * Inspired by Rust's Result<T, E> type.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/** Create a successful Result containing a value. */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Create a failed Result containing an error. */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function wrapException<T>(fn: () => T): Result<T, Error> {
  try {
    return Ok(fn());
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}

export async function wrapExceptionAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    return Ok(await fn());
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}
