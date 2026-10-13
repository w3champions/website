// Give the frame-fit range room on the slider; use proportional zoom steps above 100%.
export function portraitZoomFromSlider(position: number, minimum: number): number {
  const value = Math.max(0, Math.min(100, position));
  if (minimum < 1) {
    if (value <= 20) return minimum + (1 - minimum) * value / 20;
    return 4 ** ((value - 20) / 80);
  }
  return 4 ** (value / 100);
}

export function portraitZoomToSlider(zoom: number, minimum: number): number {
  const value = Math.max(minimum, Math.min(4, zoom));
  if (minimum < 1) {
    if (value <= 1) return (value - minimum) / (1 - minimum) * 20;
    return 20 + Math.log(value) / Math.log(4) * 80;
  }
  return Math.log(value) / Math.log(4) * 100;
}
