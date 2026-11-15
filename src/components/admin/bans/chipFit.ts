export const CHIP_GAP_PX = 4;

/** Chips to show so "+N" (when any is hidden) keeps its full width; at least 1 when there are chips (that chip may shrink with an ellipsis). */
export function fitChipCount(chipWidths: readonly number[], plusWidth: number, available: number, gap: number = CHIP_GAP_PX): number {
  const count = chipWidths.length;
  if (count === 0) return 0;
  let best = 1;
  let used = 0;
  for (let n = 1; n <= count; n++) {
    used += chipWidths[n - 1] + (n > 1 ? gap : 0);
    const total = used + (n < count ? gap + plusWidth : 0);
    if (total <= available) best = n;
  }
  return best;
}
