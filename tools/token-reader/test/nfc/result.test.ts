import { describe, it, expect } from "vitest";
import { Ok, Err, type Result } from "../../src/nfc/result.ts";

describe("Result", () => {
  describe("Ok", () => {
    it("creates a result with ok: true", () => {
      const result = Ok(42);
      expect(result.ok).toBe(true);
    });

    it("carries the value", () => {
      const result = Ok("hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("hello");
      }
    });

    it("works with undefined", () => {
      const result = Ok(undefined);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe("Err", () => {
    it("creates a result with ok: false", () => {
      const result = Err(new Error("fail"));
      expect(result.ok).toBe(false);
    });

    it("carries the error", () => {
      const error = new Error("something went wrong");
      const result = Err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
        expect(result.error.message).toBe("something went wrong");
      }
    });

    it("works with string errors", () => {
      const result: Result<number, string> = Err("bad input");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("bad input");
      }
    });
  });

  describe("type narrowing", () => {
    it("narrows to value on ok check", () => {
      const result: Result<number> = Ok(42);
      if (result.ok) {
        // TypeScript should know `value` exists here
        const n: number = result.value;
        expect(n).toBe(42);
      }
    });

    it("narrows to error on !ok check", () => {
      const result: Result<number> = Err(new Error("fail"));
      if (!result.ok) {
        // TypeScript should know `error` exists here
        const e: Error = result.error;
        expect(e.message).toBe("fail");
      }
    });
  });
});
