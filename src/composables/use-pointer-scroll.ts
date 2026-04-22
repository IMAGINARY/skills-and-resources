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
  /**
   * Exponential decay rate (base 10) in 1/s for scroll inertia.
   * The velocity decays as `v(t) = v₀ · 10^(-friction · t)`.
   * The value represents how many orders of magnitude the velocity drops per second.
   * 0 = no decay, Infinity = instant stop (no inertia).
   */
  inertiaFriction?: number;
  /** Delay in ms after inertia stops before snap engages. Default: 200. */
  snapDelay?: number;
}

const defaultOptions: Required<UsePointerScrollOptions> = {
  axis: "x",
  snap: true,
  snapStrictness: "mandatory",
  smooth: true,
  inertiaFriction: 1.1,
  snapDelay: 200,
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
  const { axis, snap, snapStrictness, smooth, inertiaFriction, snapDelay } = {
    ...defaultOptions,
    ...options,
  };
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

    const scrollObj =
      axis === "x"
        ? {
            getScrollPosition: () => containerValue.scrollLeft,
            getMaxScrollPosition: () => containerValue.scrollWidth - containerValue.clientWidth,
            setScrollPosition: (position: number) =>
              containerValue.scrollTo({ left: position, behavior: "instant" }),
          }
        : {
            getScrollPosition: () => containerValue.scrollTop,
            getMaxScrollPosition: () => containerValue.scrollHeight - containerValue.clientHeight,
            setScrollPosition: (position: number) =>
              containerValue.scrollTo({ top: position, behavior: "instant" }),
          };

    const MIN_VELOCITY_PX_PER_MS = 0.03; // ~0.5px per 16ms frame
    const scrollPositionTracker = new (class {
      velocity: number = 0;
      _pos: number = 0;
      friction: number = 0;

      set pos(position: number) {
        this._pos = Math.max(0, Math.min(position, scrollObj.getMaxScrollPosition()));
        scrollObj.setScrollPosition(position);
      }

      get pos(): number {
        return this._pos;
      }

      update(dt: number) {
        this.velocity *= 10 ** (-(this.friction * dt) / 1000);
        const position = this.pos - this.velocity * dt;
        this.pos = position; // assignment to a clamped setter
        const preventedOverscroll = position - this.pos;
        if (preventedOverscroll !== 0)
          // Hitting a scroll boundary causes a full stop
          this.velocity = 0;
      }
    })();

    const scrollAnimator = (() => {
      let lastTimestamp = performance.now();

      const callback = (timestamp: DOMHighResTimeStamp) => {
        const dt = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        scrollPositionTracker.update(dt);
        if (
          scrollPositionTracker.friction > 0 &&
          Math.abs(scrollPositionTracker.velocity) < MIN_VELOCITY_PX_PER_MS
        )
          pause();
      };

      let requestAnimationFrameId: ReturnType<typeof requestAnimationFrame> | null = null;
      let snapTimeoutId: ReturnType<typeof setTimeout> = setTimeout(enableSnapping, snapDelay);
      const loop = (timestamp: DOMHighResTimeStamp) => {
        requestAnimationFrameId = requestAnimationFrame(loop);
        callback(timestamp);
        clearTimeout(snapTimeoutId);
        snapTimeoutId = setTimeout(enableSnapping, snapDelay);
      };
      const pause = () => {
        if (requestAnimationFrameId === null) return;

        cancelAnimationFrame(requestAnimationFrameId);
        requestAnimationFrameId = null;
      };

      const play = () => {
        if (requestAnimationFrameId !== null) return;

        disableSnapping();
        pause();
        lastTimestamp = performance.now();
        requestAnimationFrameId = requestAnimationFrame(loop);
      };
      return {
        pause,
        play,
      };
    })();

    dragController = useDrag(
      (state) => {
        const {
          vxvy: [vx, vy],
          first,
          last,
          tap,
        } = state;

        if (first) {
          scrollPositionTracker.friction = 0;
          scrollPositionTracker.velocity = 0;
          scrollPositionTracker.pos = scrollObj.getScrollPosition();
        }

        scrollPositionTracker.velocity = axis === "x" ? vx : vy;
        scrollAnimator.play();

        if (last || tap) {
          if (scrollPositionTracker.velocity === 0)
            scrollAnimator.pause(); // pause immediately
          else scrollPositionTracker.friction = inertiaFriction; // start inertia decay
        }
      },
      {
        domTarget: containerValue,
        manual: true,
      },
    );

    const handleScrollSnapChange = (e: Event) => {
      // @ts-expect-error: e.snapTargetBlock is not defined (API too new)
      currentChild = axis === "x" ? e.snapTargetInline : e.snapTargetBlock;
      if (currentChild === null) return;
      isFirstInternal.value = currentChild === containerValue.firstElementChild;
      isLastInternal.value = currentChild === containerValue.lastElementChild;
    };
    useEventListener(container, "scrollsnapchanging", handleScrollSnapChange);
    useEventListener(container, "scrollsnapchange", handleScrollSnapChange);

    currentChild =
      containerValue?.children[0] instanceof HTMLElement ? containerValue?.children[0] : null;

    dragController.bind();
  });

  return { prev, next, isFirst, isLast };
}
