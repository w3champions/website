export const PORTRAIT_SIZE = 256;

export function portraitCrop(width: number, height: number, zoom: number, x: number, y: number): { x: number; y: number; side: number } {
  const side = Math.min(width, height) / Math.max(1, zoom);
  return {
    x: (width - side) * Math.min(100, Math.max(0, x)) / 100,
    y: (height - side) * Math.min(100, Math.max(0, y)) / 100,
    side,
  };
}

// Preview and export use the same canvas, including the optional frame.
export function drawPortrait(canvas: HTMLCanvasElement, source: HTMLImageElement, frame: HTMLImageElement | null, zoom: number, x: number, y: number): void {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser cannot create the portrait preview.");
  canvas.width = PORTRAIT_SIZE;
  canvas.height = PORTRAIT_SIZE;
  const crop = portraitCrop(source.naturalWidth, source.naturalHeight, zoom, x, y);
  context.fillStyle = "#000";
  context.fillRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, crop.x, crop.y, crop.side, crop.side, 0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
  if (frame) context.drawImage(frame, 0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
}
