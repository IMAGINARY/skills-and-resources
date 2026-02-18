import { describe, it, expect, vi } from "vitest";
import { TypedEventEmitter } from "../../src/nfc/TypedEventEmitter.ts";

interface TestEvents {
  data: (payload: string) => void;
  count: (n: number) => void;
  empty: () => void;
}

// Subclass to expose protected `emit` for testing
class TestEmitter extends TypedEventEmitter<TestEvents> {
  public doEmit<K extends keyof TestEvents & string>(
    event: K,
    ...args: Parameters<TestEvents[K]>
  ): boolean {
    return this.emit(event, ...args);
  }
}

describe("TypedEventEmitter", () => {
  it("calls listener on emit", () => {
    const emitter = new TestEmitter();
    const listener = vi.fn();
    emitter.on("data", listener);

    emitter.doEmit("data", "hello");

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith("hello");
  });

  it("supports multiple listeners on the same event", () => {
    const emitter = new TestEmitter();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on("data", a);
    emitter.on("data", b);

    emitter.doEmit("data", "test");

    expect(a).toHaveBeenCalledWith("test");
    expect(b).toHaveBeenCalledWith("test");
  });

  it("once listener fires only once", () => {
    const emitter = new TestEmitter();
    const listener = vi.fn();
    emitter.once("count", listener);

    emitter.doEmit("count", 1);
    emitter.doEmit("count", 2);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(1);
  });

  it("off removes a specific listener", () => {
    const emitter = new TestEmitter();
    const listener = vi.fn();
    emitter.on("data", listener);
    emitter.off("data", listener);

    emitter.doEmit("data", "ignored");

    expect(listener).not.toHaveBeenCalled();
  });

  it("removeAllListeners removes all listeners for an event", () => {
    const emitter = new TestEmitter();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on("data", a);
    emitter.on("data", b);
    emitter.removeAllListeners("data");

    emitter.doEmit("data", "ignored");

    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it("removeAllListeners without argument removes all listeners", () => {
    const emitter = new TestEmitter();
    const dataListener = vi.fn();
    const countListener = vi.fn();
    emitter.on("data", dataListener);
    emitter.on("count", countListener);
    emitter.removeAllListeners();

    emitter.doEmit("data", "ignored");
    emitter.doEmit("count", 99);

    expect(dataListener).not.toHaveBeenCalled();
    expect(countListener).not.toHaveBeenCalled();
  });

  it("listenerCount returns the correct count", () => {
    const emitter = new TestEmitter();
    expect(emitter.listenerCount("data")).toBe(0);

    const listener = vi.fn();
    emitter.on("data", listener);
    expect(emitter.listenerCount("data")).toBe(1);

    emitter.on("data", vi.fn());
    expect(emitter.listenerCount("data")).toBe(2);

    emitter.off("data", listener);
    expect(emitter.listenerCount("data")).toBe(1);
  });

  it("emit returns false when no listeners", () => {
    const emitter = new TestEmitter();
    expect(emitter.doEmit("empty")).toBe(false);
  });

  it("emit returns true when listeners exist", () => {
    const emitter = new TestEmitter();
    emitter.on("empty", vi.fn());
    expect(emitter.doEmit("empty")).toBe(true);
  });

  it("on returns this for chaining", () => {
    const emitter = new TestEmitter();
    const result = emitter.on("data", vi.fn());
    expect(result).toBe(emitter);
  });

  it("handles events with no arguments", () => {
    const emitter = new TestEmitter();
    const listener = vi.fn();
    emitter.on("empty", listener);

    emitter.doEmit("empty");

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith();
  });
});
