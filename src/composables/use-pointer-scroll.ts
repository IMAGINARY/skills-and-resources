import { computed, type ComputedRef, type MaybeRefOrGetter, ref, toValue } from "vue";
import { useDrag } from "@vueuse/gesture";
import { useEventListener, watchImmediate } from "@vueuse/core";

type Axis = "x" | "y";
type SnapAxes = Axis; // CSS Scroll Snapping supports more, but we restrict ourselves to x and y to simplify the implementation.
type SnapStrictness = "mandatory" | "proximity";
type SnapType = "none" | `${SnapAxes} ${SnapStrictness}`;

export interface UsePointerScrollOptions {
  axis: "x" | "y";
  snap?: boolean;
  snapStrictness?: SnapStrictness;
  smooth?: boolean;
}

const defaultOptions: Required<UsePointerScrollOptions> = {
  axis: "x",
  snap: true,
  snapStrictness: "mandatory",
  smooth: true,
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
  const { axis, snap, snapStrictness, smooth } = { ...defaultOptions, ...options };
  const snapType: SnapType = snap ? `${axis} ${snapStrictness}` : "none";

  let currentChild: HTMLElement | null | undefined = null;

  const prev = () => {
    if (!currentChild) return;
    if (!currentChild.previousElementSibling) return;
    if (!(currentChild.previousElementSibling instanceof HTMLElement)) return;
    const left = currentChild.previousElementSibling.offsetLeft;
    currentChild.parentElement?.scrollTo({ left, behavior: smooth ? "smooth" : "instant" });
  };

  const next = () => {
    if (!currentChild) return;
    if (!currentChild.nextElementSibling) return;
    if (!(currentChild.nextElementSibling instanceof HTMLElement)) return;
    const left = currentChild.nextElementSibling.offsetLeft;
    currentChild.parentElement?.scrollTo({ left, behavior: smooth ? "smooth" : "instant" });
  };

  const isFirstInternal = ref(true);
  const isLastInternal = ref(false);
  const isFirst = computed(() => isFirstInternal.value);
  const isLast = computed(() => isLastInternal.value);

  if (typeof container === "undefined" || container === null)
    return { prev, next, isFirst, isLast };

  let dragController = useDrag(() => {}, {});
  watchImmediate(container, (container) => {
    dragController.clean();
    if (typeof container === "undefined" || container === null) return;
    const containerValue = toValue(container);

    if (typeof containerValue === "undefined" || containerValue === null) return;

    const enableSnapping = () => {
      containerValue.style.scrollSnapType = snapType;
      containerValue.style.scrollBehavior = smooth ? "smooth" : "auto";
    };

    const disableSnapping = () => {
      containerValue.style.scrollSnapType = "none";
      containerValue.style.scrollBehavior = "auto";
    };

    enableSnapping();

    dragController = useDrag(
      (state) => {
        const {
          delta: [x, y],
          dragging,
          first,
          last,
        } = state;

        // oxlint-disable-next-line typescript/no-meaningless-void-operator
        if (last) return void enableSnapping();

        if (!dragging) return;

        // oxlint-disable-next-line typescript/no-meaningless-void-operator
        if (first) return void disableSnapping();

        containerValue.scrollBy(-x, -y);
      },
      {
        domTarget: containerValue,
        manual: true,
        axis,
      },
    );

    const handleScrollSnapChange = (e: Event) => {
      // @ts-expect-error: e.snapTargetBlock is not defined (API too new)
      currentChild = axis === "x" ? e.snapTargetInline : e.snapTargetBlock;
      isFirstInternal.value = currentChild === containerValue.firstElementChild;
      isLastInternal.value = currentChild === containerValue.lastElementChild;
    };
    useEventListener(container, "scrollsnapchange", handleScrollSnapChange);

    currentChild =
      containerValue?.children[0] instanceof HTMLElement ? containerValue?.children[0] : null;

    dragController.bind();

    /*
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
      */
  });

  return { prev, next, isFirst, isLast };
}
