import { portraitAnimationFormat } from "@/helpers/portraitAnimation";
import { PORTRAIT_SIZE } from "@/helpers/portraitCrop";

// Existing portraits already contain their frame. Re-encode without adding another one.
export async function optimizePortrait(file: File, status: (message: string) => void): Promise<File> {
  if (file.size > 20 * 1024 * 1024) throw new Error("Sources must be no larger than 20 MB.");
  const format = portraitAnimationFormat(new Uint8Array(await file.arrayBuffer()));
  const source = await createImageBitmap(file);
  try {
    if (source.width !== source.height) throw new Error("This image is not square. Use Replace portrait to crop it first.");
    if (format) {
      const { exportAnimatedPortrait } = await import("@/services/AnimatedPortraitService");
      return await exportAnimatedPortrait(file, format, { x: 0, y: 0, side: source.width }, null, status, true);
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = PORTRAIT_SIZE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
    const { exportStillPortrait } = await import("@/services/StillPortraitService");
    return await exportStillPortrait(canvas);
  } finally {
    source.close();
  }
}
