export const useTap =
  (callback: () => void) =>
  ({ tap }: { tap: boolean }) =>
    tap ? callback() : undefined;
