// Native canvas encoding is cheapest; load libwebp only if the browser falls back to PNG.
export async function exportStillPortrait(canvas: HTMLCanvasElement): Promise<File> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  if (blob?.type === "image/webp") return new File([blob], "portrait.webp", { type: "image/webp" });
  const pixels = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height);
  if (!pixels) throw new Error("Could not export the portrait.");
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./StillPortraitService.worker.ts", import.meta.url), { type: "module" });
    const cleanup = () => {
      clearTimeout(timeout);
      worker.terminate();
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Still portrait encoding timed out."));
    }, 60000);
    worker.onmessage = ({ data }) => {
      cleanup();
      if (data.error) reject(new Error(data.error));
      else resolve(new File([data.bytes], "portrait.webp", { type: "image/webp" }));
    };
    worker.onerror = () => {
      cleanup();
      reject(new Error("Could not load the WebP encoder."));
    };
    worker.postMessage({ pixels: pixels.data, width: canvas.width, height: canvas.height }, [pixels.data.buffer]);
  });
}
