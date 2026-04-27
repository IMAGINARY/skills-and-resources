import { ref, watch } from "vue";

export type UseTooltipOptions = {
  timeout?: number;
};

const defaultOptions: Required<UseTooltipOptions> = {
  timeout: 2000,
};

export function useTooltip(options: UseTooltipOptions = {}) {
  const { timeout } = { ...defaultOptions, ...options };

  let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;
  const showTooltip = ref(false);

  const toggleTooltip = () => {
    showTooltip.value = !showTooltip.value;
  };

  watch(showTooltip, () => {
    if (tooltipTimeout !== null) clearTimeout(tooltipTimeout);
    if (showTooltip.value) tooltipTimeout = setTimeout(() => (showTooltip.value = false), timeout);
  });

  return { showTooltip, toggleTooltip };
}
