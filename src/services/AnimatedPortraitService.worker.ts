// Decode and compose each frame off the main thread; encode with libwebp.
// A fresh worker per export releases the WASM heap when the job completes.
import { PORTRAIT_FRAME_INSET, PORTRAIT_SIZE } from "@/helpers/portraitCrop";
import { animatedWebpFrame, assembleAnimatedWebp } from "@/helpers/animatedWebp";
import { animationFrameDelaysMilliseconds, portraitAnimationDimensions } from "@/helpers/portraitAnimation";
import type { PortraitAnimationFormat } from "@/helpers/portraitAnimation";

type Patch = { image: ImageBitmap | ImageData; left: number; top: number; width: number; height: number; duration: number; dispose: number; replace: boolean; background?: string };
type Codec = { decodeAnimation(data: Uint8Array, alpha: boolean): { data: Uint8Array; duration: number; width: number; height: number }[] | null; encode(data: Uint8Array, width: number, height: number, hasAlpha: boolean, config: { lossless: number; quality: number }): Uint8Array | null };

function canvas(width: number, height: number) {
  if (width < 1 || height < 1 || width * height > 4_000_000) throw new Error("Source frames must be no larger than 4 megapixels.");
  const image = new OffscreenCanvas(width, height);
  const context = image.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  return { image, context };
}

async function* patches(bytes: Uint8Array, format: PortraitAnimationFormat, codec: Codec): AsyncGenerator<Patch, void> {
  if (format === "gif") {
    const { parseGIF, decompressFrame } = await import("gifuct-js");
    const parsed = parseGIF(bytes.buffer as ArrayBuffer);
    const frames = parsed.frames.filter((frame) => "image" in frame);
    if (frames.length > 600) throw new Error("Animations must have no more than 600 frames.");
    canvas(parsed.lsd.width, parsed.lsd.height); // Validate the logical screen before decompressing.
    for (const raw of frames) {
      const rect = raw.image.descriptor;
      if (rect.width < 1 || rect.height < 1 || rect.left + rect.width > parsed.lsd.width || rect.top + rect.height > parsed.lsd.height) throw new Error("Invalid GIF frame dimensions.");
      const decoded = decompressFrame(raw, parsed.gct, true);
      const { left, top, width, height } = decoded.dims;
      if (left + width > parsed.lsd.width || top + height > parsed.lsd.height) throw new Error("Invalid GIF frame dimensions.");
      const color = parsed.gct?.[parsed.lsd.backgroundColorIndex];
      yield { image: new ImageData(new Uint8ClampedArray(decoded.patch), width, height), left, top, width, height, duration: decoded.delay < 20 ? 100 : decoded.delay || 100, dispose: decoded.disposalType === 2 ? 1 : decoded.disposalType === 3 ? 2 : 0, replace: false, background: raw.gce?.extras.transparentColorGiven || !color ? undefined : `rgb(${color.join(",")})` };
    }
  } else if (format === "apng") {
    const imported = await import("apng-js");
    const parseAPNG = typeof imported.default === "function" ? imported.default : (imported.default as unknown as { default: typeof imported.default }).default;
    const parsed = parseAPNG(bytes.buffer as ArrayBuffer);
    if (parsed instanceof Error) throw parsed;
    if (parsed.frames.length > 600) throw new Error("Animations must have no more than 600 frames.");
    canvas(parsed.width, parsed.height);
    // apng-js replaces delays <= 10 ms with 100 ms for playback. Export the file's real timing.
    const delays = animationFrameDelaysMilliseconds(bytes, "apng");
    for (const [index, frame] of parsed.frames.entries()) {
      if (frame.left < 0 || frame.top < 0 || frame.width < 1 || frame.height < 1 || frame.left + frame.width > parsed.width || frame.top + frame.height > parsed.height) throw new Error("Invalid APNG frame dimensions.");
      if (!frame.imageData) throw new Error("APNG frame is missing.");
      yield { image: await createImageBitmap(frame.imageData), left: frame.left, top: frame.top, width: frame.width, height: frame.height, duration: delays[index] || 100, dispose: frame.disposeOp, replace: frame.blendOp === 0 };
    }
  } else {
    // The codec returns fully composed WebP frames with exact millisecond delays.
    const frames = codec.decodeAnimation(bytes, true);
    if (!frames?.length || frames.length > 600) throw new Error("Could not decode WebP, or it exceeds 600 frames.");
    for (const frame of frames) {
      yield { image: new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height), left: 0, top: 0, width: frame.width, height: frame.height, duration: frame.duration, dispose: 0, replace: true };
    }
  }
}

async function encode(data: { file: File; format: PortraitAnimationFormat; crop: { x: number; y: number; side: number }; frameURL: string | null; keepAnimation: boolean }) {
  const { file, format, crop, frameURL, keepAnimation } = data;
  if (file.size > 20 * 1024 * 1024) throw new Error("Sources must be no larger than 20 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const dimensions = portraitAnimationDimensions(bytes, format);
  const source = canvas(dimensions.width, dimensions.height);
  if (dimensions.frames > 600) throw new Error("Animations must have no more than 600 frames.");
  // libwebp's animation decoder returns all WebP frames, so bound that allocation first.
  if (format === "webp" && dimensions.width * dimensions.height * dimensions.frames > 32_000_000) {
    throw new Error("This WebP animation is too large to decode. Try a smaller source.");
  }
  const padding = crop.side * PORTRAIT_FRAME_INSET / PORTRAIT_SIZE + 0.001;
  if (![crop.x, crop.y, crop.side].every(Number.isFinite) || crop.side <= 0 || crop.x < -padding * 2 || crop.y < -padding * 2 || crop.x + crop.side > dimensions.width + padding * 2 || crop.y + crop.side > dimensions.height + padding * 2) {
    throw new Error("The portrait crop is outside the image.");
  }
  self.postMessage({ status: keepAnimation ? "Loading animation encoder…" : "Preparing the first frame…" });
  const { default: createCodec } = await import("wasm-webp/dist/esm/webp-wasm.js");
  const codec: Codec = await createCodec({ locateFile: () => new URL("../../node_modules/wasm-webp/dist/esm/webp-wasm.wasm", import.meta.url).href });
  const output = canvas(PORTRAIT_SIZE, PORTRAIT_SIZE);
  let frame: ImageBitmap | null = null;
  if (frameURL) {
    const response = await fetch(frameURL);
    if (!response.ok) throw new Error("Could not load the standard frame.");
    frame = await createImageBitmap(await response.blob());
  }
  const frames: Uint8Array[] = [];
  let elapsed = 0;
  let roundedElapsed = 0;
  let outputBytes = 0;
  let previous: Patch | undefined;
  let saved: ImageData | undefined;
  let index = 0;
  for await (const patch of patches(bytes, format, codec)) {
    if (patch.left < 0 || patch.top < 0 || patch.width < 1 || patch.height < 1 || patch.left + patch.width > source.image.width || patch.top + patch.height > source.image.height) {
      throw new Error("Invalid animation frame dimensions.");
    }
    if (!previous && patch.background) {
      source.context.fillStyle = patch.background;
      source.context.fillRect(0, 0, source.image.width, source.image.height);
    }
    if (previous?.dispose === 1) {
      source.context.clearRect(previous.left, previous.top, previous.width, previous.height);
      if (previous.background) {
        source.context.fillStyle = previous.background;
        source.context.fillRect(previous.left, previous.top, previous.width, previous.height);
      }
    } else if (previous?.dispose === 2 && saved) source.context.putImageData(saved, 0, 0);
    saved = patch.dispose === 2 ? source.context.getImageData(0, 0, source.image.width, source.image.height) : undefined;
    if (patch.replace) source.context.clearRect(patch.left, patch.top, patch.width, patch.height);
    if (patch.image instanceof ImageData) {
      const temp = canvas(patch.width, patch.height);
      temp.context.putImageData(patch.image, 0, 0);
      source.context.drawImage(temp.image, patch.left, patch.top);
    } else {
      source.context.drawImage(patch.image, patch.left, patch.top);
      patch.image.close();
    }
    output.context.clearRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
    if (crop.side > Math.min(dimensions.width, dimensions.height)) {
      output.context.fillStyle = "#000";
      output.context.fillRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
    }
    output.context.imageSmoothingQuality = "high";
    output.context.drawImage(source.image, crop.x, crop.y, crop.side, crop.side, 0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
    if (frame) output.context.drawImage(frame, 0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
    self.postMessage({ status: `Encoding frame ${++index}…` });
    const pixels = new Uint8Array(output.context.getImageData(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE).data);
    const webp = codec.encode(pixels, PORTRAIT_SIZE, PORTRAIT_SIZE, true, { quality: keepAnimation ? 80 : 90, lossless: 0 });
    if (!webp) throw new Error("WebP encoding failed.");
    if (!keepAnimation) {
      frame?.close();
      return webp;
    }
    elapsed += patch.duration;
    const duration = Math.max(1, Math.round(elapsed) - roundedElapsed);
    roundedElapsed += duration;
    frames.push(animatedWebpFrame(webp, duration));
    outputBytes += frames[frames.length - 1].length;
    if (outputBytes > 20 * 1024 * 1024) throw new Error("The generated animation exceeds 20 MB. Try a smaller animation.");
    previous = patch;
  }
  frame?.close();
  if (!frames.length) throw new Error("No animation frames found.");
  return assembleAnimatedWebp(frames);
}

self.onmessage = async ({ data }) => {
  try {
    const bytes = await encode(data);
    self.postMessage({ bytes }, { transfer: [bytes.buffer] });
  }
  catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
