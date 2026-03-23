import { computed, type ComputedRef, type MaybeRefOrGetter, ref, toValue } from "vue";
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
): {
  prev: () => void;
  next: () => void;
  isFirst: ComputedRef<boolean>;
  isLast: ComputedRef<boolean>;
} {
  const { vertical, horizontal, snapType, smoothSnapping } = { ...defaultOptions, ...options };

  let currentChild: HTMLElement | null | undefined = null;

  const prev = () => {
    console.log("prev", currentChild);
    if (!currentChild) return;
    if (!currentChild.previousElementSibling) return;
    if (!(currentChild.previousElementSibling instanceof HTMLElement)) return;
    const left = currentChild.previousElementSibling.offsetLeft;
    currentChild.parentElement?.scrollTo({ left, behavior: "smooth" });
  };

  const next = () => {
    console.log("next", currentChild);
    if (!currentChild) return;
    if (!currentChild.nextElementSibling) return;
    if (!(currentChild.nextElementSibling instanceof HTMLElement)) return;
    const left = currentChild.nextElementSibling.offsetLeft;
    currentChild.parentElement?.scrollTo({ left, behavior: "smooth" });
  };

  const isFirstInternal = ref(false);
  const isLastInternal = ref(false);
  const isFirst = computed(() => isFirstInternal.value);
  const isLast = computed(() => isLastInternal.value);

  if (typeof container === "undefined" || container === null)
    return { prev, next, isFirst, isLast };

  watchImmediate(container, (container) => {
    const containerValue = toValue(container);
    currentChild =
      containerValue?.children[0] instanceof HTMLElement ? containerValue?.children[0] : null;

    if (typeof containerValue === "undefined" || containerValue === null) return;

    const lastScroll = { left: containerValue.scrollLeft, top: containerValue.scrollTop };

    const activePointers = new Array<number>();

    containerValue.style.scrollSnapType = snapType;
    containerValue.style.scrollBehavior = smoothSnapping ? "smooth" : "auto";

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

    const handleScrollSnapChange = (e: Event) => {
      // @ts-expect-error: e.snapTargetBlock is not defined (API too new)
      currentChild = e.snapTargetInline;
      isFirstInternal.value = currentChild === containerValue.firstElementChild;
      isLastInternal.value = currentChild === containerValue.lastElementChild;
    };

    useEventListener(container, "pointerdown", handlePointerDown);
    useEventListener(container, "pointermove", handlePointerMove);
    useEventListener(container, "scrollsnapchange", handleScrollSnapChange);
    useEventListener(container, ["pointerup", "pointercancel", "pointer"], handlePointerUpOrCancel);
  });

  return { prev, next, isFirst, isLast };
}
