import { InvalidArgumentError } from "@commander-js/extra-typings";

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseNonNegativeInteger(s: string): number {
  const number = parseInt(s, 10);
  if (isNaN(number) || number < 0)
    throw new InvalidArgumentError(`Not a non-negative integer: ${s}`);
  return number;
}
