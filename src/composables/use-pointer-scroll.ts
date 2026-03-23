import { type MaybeRefOrGetter, toValue } from "vue";
import { useEventListener, watchImmediate } from "@vueuse/core";

export interface UsePointerScrollOptions {
  vertical?: boolean;
  horizontal?: boolean;
  snapType?: SnapType;
  smoothSnapping?: boolean;
}

type SnapAxes = "x" | "y" | "block" | "inline" | "both";
type SnapStrictness = "mandatory" | "proximity";

type SnapType = "none" | `${SnapAxes} ${SnapStrictness}`;

const defaultOptions: Required<UsePointerScrollOptions> = {
  vertical: true,
  horizontal: true,
  snapType: "both mandatory",
  smoothSnapping: true,
};

export function usePointerScroll(
  container: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options?: UsePointerScrollOptions,
) {
  const { vertical, horizontal, snapType, smoothSnapping } = { ...defaultOptions, ...options };

  if (typeof container === "undefined" || container === null) return;

  watchImmediate(container, (container) => {
    const containerValue = toValue(container);

    if (typeof containerValue === "undefined" || containerValue === null) return;

    const lastScroll = { left: containerValue.scrollLeft, top: containerValue.scrollTop };

    const activePointers = new Array<number>();

    const handlePointerDown = (e: PointerEvent) => {
      containerValue.setPointerCapture(e.pointerId);
      if (!activePointers.includes(e.pointerId)) activePointers.push(e.pointerId);
      lastScroll.left = containerValue.scrollLeft;
      lastScroll.top = containerValue.scrollTop;

      containerValue.style.scrollSnapType = "none";
      containerValue.style.scrollBehavior = "auto";
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
      containerValue.releasePointerCapture(e.pointerId);
      const pointerIdIdx = activePointers.findLastIndex((id) => id === e.pointerId);
      if (pointerIdIdx === -1) return;
      activePointers.splice(pointerIdIdx, 1);
      if (activePointers.length > 0) return;
      containerValue.style.scrollSnapType = snapType;
      containerValue.style.scrollBehavior = smoothSnapping ? "smooth" : "auto";
    };

    useEventListener(container, "pointerdown", handlePointerDown);
    useEventListener(container, "pointermove", handlePointerMove);
    useEventListener(container, ["pointerup", "pointercancel"], handlePointerUpOrCancel);
  });
}
