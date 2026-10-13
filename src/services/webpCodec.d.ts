declare module "wasm-webp/dist/esm/webp-wasm.js" {
  const factory: (options: { locateFile: (path: string) => string }) => Promise<{
    encode(data: Uint8Array, width: number, height: number, alpha: boolean, config: { lossless: number; quality: number }): Uint8Array | null;
    decodeAnimation(data: Uint8Array, alpha: boolean): { width: number; height: number; data: Uint8Array; duration: number }[] | null;
  }>;
  export default factory;
}
