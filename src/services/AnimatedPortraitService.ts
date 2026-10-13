import type { portraitCrop } from "@/helpers/portraitCrop";
import type { PortraitAnimationFormat } from "@/helpers/portraitAnimation";

export function exportAnimatedPortrait(file: File, format: PortraitAnimationFormat, crop: ReturnType<typeof portraitCrop>, frameURL: string | null, status: (message: string) => void, keepAnimation = true): Promise<File> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./AnimatedPortraitService.worker.ts", import.meta.url), { type: "module" });
    const cleanup = () => {
      clearTimeout(timeout);
      worker.terminate();
      status("");
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Conversion exceeded 60 seconds. Try a smaller animation."));
    }, 60000);
    worker.onmessage = ({ data }) => {
      if (data.status) {
        status(data.status);
        return;
      }
      cleanup();
      if (data.error) reject(new Error(data.error));
      else resolve(new File([data.bytes], "portrait.webp", { type: "image/webp" }));
    };
    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || "Image codec worker failed."));
    };
    worker.postMessage({ file, format, crop, frameURL, keepAnimation });
  });
}
