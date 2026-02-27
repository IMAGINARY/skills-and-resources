import { type MaybeRefOrGetter, toValue } from "vue";
import { useEventListener, watchImmediate } from "@vueuse/core";

export interface UsePointerScrollOptions {
  vertical?: boolean;
  horizontal?: boolean;
}

const defaultOptions: Required<UsePointerScrollOptions> = {
  vertical: true,
  horizontal: true,
};

export function usePointerScroll(
  container: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options?: UsePointerScrollOptions,
) {
  const { vertical, horizontal } = { ...defaultOptions, ...options };

  if (typeof container === "undefined" || container === null) return;

  watchImmediate(container, (container) => {
    const containerValue = toValue(container);

    if (typeof containerValue === "undefined" || containerValue === null) return;

    const lastScroll = { left: containerValue.scrollLeft, top: containerValue.scrollTop };

    const activePointers = new Array<number>();
    let abortSnap = () => {};

    const handlePointerDown = (e: PointerEvent) => {
      abortSnap();
      activePointers.push(e.pointerId);
      lastScroll.left = containerValue.scrollLeft;
      lastScroll.top = containerValue.scrollTop;

      containerValue.style.scrollSnapType = "none";
    };

    const handlePointerMove = (e: PointerEvent) => {
      const lastPointerId = activePointers[activePointers.length - 1];
      if (typeof lastPointerId === "undefined") return;
      if (lastPointerId !== e.pointerId) return;

      if (horizontal) {
        containerValue.scrollLeft -= e.movementX;
        lastScroll.left = containerValue.scrollLeft;
      }
      if (vertical) {
        containerValue.scrollTop -= e.movementY;
        lastScroll.top = containerValue.scrollTop;
      }
    };

    const handlePointerUpOrCancel = (e: PointerEvent) => {
      const pointerIdIdx = activePointers.findLastIndex((id) => id === e.pointerId);
      if (pointerIdIdx === -1) return;
      activePointers.splice(pointerIdIdx, 1);
      containerValue.style.scrollSnapType = "x mandatory";
    };

    const handleScrollSnapChange = (e) => {
      if (e.snapTargetBlock === null && e.snapTargetInline === null) return;

      console.log("test");

      containerValue.style.scrollSnapType = "none";

      const { scrollLeft, scrollTop } = containerValue;

      containerValue.scrollLeft = lastScroll.left;
      containerValue.scrollTop = lastScroll.top;

      console.log({ scrollLeft, scrollTop }, lastScroll);

      abortSnap();
      const timeoutId = setTimeout(
        () => containerValue.scrollTo({ top: scrollTop, left: scrollLeft, behavior: "smooth" }),
        0,
      );
      abortSnap = () => clearTimeout(timeoutId);
    };

    useEventListener(container, "pointerdown", handlePointerDown);
    useEventListener(container, "scrollsnapchange", handleScrollSnapChange);
    useEventListener(container, "pointermove", handlePointerMove);
    useEventListener(container, ["pointerup", "pointercancel"], handlePointerUpOrCancel);
  });
}
