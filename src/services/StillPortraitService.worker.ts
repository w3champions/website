import createCodec from "wasm-webp/dist/esm/webp-wasm.js";

self.onmessage = async ({ data }) => {
  try {
    const codec = await createCodec({ locateFile: () => new URL("../../node_modules/wasm-webp/dist/esm/webp-wasm.wasm", import.meta.url).href });
    const bytes = codec.encode(new Uint8Array(data.pixels), data.width, data.height, true, { lossless: 0, quality: 90 });
    if (!bytes) throw new Error("Could not encode the WebP portrait.");
    self.postMessage({ bytes }, { transfer: [bytes.buffer] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
