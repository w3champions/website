import { PORTRAIT_SIZE } from "./portraitCrop";

function chunk(name: string, payload: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(8 + payload.length + payload.length % 2);
  bytes.set(new TextEncoder().encode(name));
  new DataView(bytes.buffer).setUint32(4, payload.length, true);
  bytes.set(payload, 8);
  return bytes;
}
function join(parts: Uint8Array[]): Uint8Array {
  const bytes = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}
function uint24(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = value >> 8 & 255;
  bytes[offset + 2] = value >> 16 & 255;
}
export function animatedWebpFrame(webp: Uint8Array, duration: number): Uint8Array {
  if (!Number.isInteger(duration) || duration < 1 || duration > 0xffffff) throw new Error("Animation frame delay is out of range.");
  if (webp.length < 12 || new TextDecoder().decode(webp.subarray(0, 4)) !== "RIFF" || new TextDecoder().decode(webp.subarray(8, 12)) !== "WEBP") throw new Error("Invalid encoded WebP frame.");
  const payload: Uint8Array[] = [];
  const view = new DataView(webp.buffer, webp.byteOffset, webp.byteLength);
  for (let offset = 12; offset + 8 <= webp.length;) {
    const size = view.getUint32(offset + 4, true);
    if (offset + 8 + size + size % 2 > webp.length) throw new Error("Incomplete encoded WebP frame.");
    const name = new TextDecoder().decode(webp.subarray(offset, offset + 4));
    if (["ALPH", "VP8 ", "VP8L"].includes(name)) payload.push(webp.slice(offset, offset + 8 + size + size % 2));
    offset += 8 + size + size % 2;
  }
  if (!payload.length) throw new Error("WebP frame encoding failed.");
  const header = new Uint8Array(16);
  uint24(header, 6, PORTRAIT_SIZE - 1);
  uint24(header, 9, PORTRAIT_SIZE - 1);
  uint24(header, 12, duration);
  header[15] = 2; // Full frame replaces the previous frame, including alpha.
  return chunk("ANMF", join([header, ...payload]));
}
export function assembleAnimatedWebp(frames: Uint8Array[]): Uint8Array {
  if (!frames.length) throw new Error("No animation frames found.");
  const extended = new Uint8Array(10);
  extended[0] = 0x12; // Animation + alpha.
  uint24(extended, 4, PORTRAIT_SIZE - 1);
  uint24(extended, 7, PORTRAIT_SIZE - 1);
  const body = join([new TextEncoder().encode("WEBP"), chunk("VP8X", extended), chunk("ANIM", new Uint8Array(6)), ...frames]);
  return chunk("RIFF", body);
}
