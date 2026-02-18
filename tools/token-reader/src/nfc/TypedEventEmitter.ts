import { EventEmitter } from "events";

/**
 * A wrapper around Node's EventEmitter that enforces type safety
 * on event names and listener signatures.
 *
 * Uses composition rather than inheritance to prevent untyped
 * EventEmitter methods from leaking into the public API.
 *
 * @typeParam T - An object type mapping event names (string keys)
 *               to listener function signatures. Concrete interfaces
 *               work without needing an explicit index signature.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TypedEventEmitter<T extends { [K in keyof T]: (...args: any[]) => void }> {
  private emitter = new EventEmitter();

  on<K extends keyof T & string>(event: K, listener: T[K]): this {
    this.emitter.on(event, listener as (...args: any[]) => void);
    return this;
  }

  once<K extends keyof T & string>(event: K, listener: T[K]): this {
    this.emitter.once(event, listener as (...args: any[]) => void);
    return this;
  }

  off<K extends keyof T & string>(event: K, listener: T[K]): this {
    this.emitter.off(event, listener as (...args: any[]) => void);
    return this;
  }

  removeAllListeners<K extends keyof T & string>(event?: K): this {
    if (event !== undefined) {
      this.emitter.removeAllListeners(event);
    } else {
      this.emitter.removeAllListeners();
    }
    return this;
  }

  listenerCount<K extends keyof T & string>(event: K): number {
    return this.emitter.listenerCount(event);
  }

  protected emit<K extends keyof T & string>(event: K, ...args: Parameters<T[K]>): boolean {
    return this.emitter.emit(event, ...args);
  }
}
