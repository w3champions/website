export type PortraitAnimationFormat = "gif" | "apng" | "webp";

function tag(bytes: Uint8Array, offset: number, length = 4): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

// Inspect the contents rather than the extension: some existing .jpg portraits are APNGs.
export function portraitAnimationFormat(bytes: Uint8Array): PortraitAnimationFormat | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (tag(bytes, 0, 6).startsWith("GIF8") && bytes.length >= 13) {
    let offset = 13 + (bytes[10] & 0x80 ? 3 * 2 ** ((bytes[10] & 7) + 1) : 0);
    let frames = 0;
    while (offset < bytes.length) {
      const block = bytes[offset++];
      if (block === 0x3b) break;
      if (block === 0x2c) {
        if (offset + 9 > bytes.length) break;
        const flags = bytes[offset + 8];
        offset += 9 + (flags & 0x80 ? 3 * 2 ** ((flags & 7) + 1) : 0);
        offset++; // LZW code size.
        if (++frames > 1) return "gif";
      } else if (block === 0x21) {
        offset++; // Extension label; extensions and image data both use sub-blocks.
      } else break;
      while (offset < bytes.length) {
        const length = bytes[offset++];
        if (!length) break;
        offset += length;
      }
    }
  }
  if (tag(bytes, 1, 3) === "PNG") {
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = view.getUint32(offset);
      if (tag(bytes, offset + 4) === "acTL" && length >= 8 && offset + 20 <= bytes.length) {
        return view.getUint32(offset + 8) > 1 ? "apng" : null;
      }
      offset += length + 12;
    }
  }
  if (tag(bytes, 0) === "RIFF" && tag(bytes, 8) === "WEBP") {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const length = view.getUint32(offset + 4, true);
      if (tag(bytes, offset) === "ANIM") return "webp";
      offset += 8 + length + (length % 2);
    }
  }
  return null;
}

// Read source and output timing for validation, including the final frame's hold.
export function animationFrameDelaysMilliseconds(bytes: Uint8Array, format: PortraitAnimationFormat): number[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const delays: number[] = [];
  if (format === "gif") {
    let offset = 13 + (bytes[10] & 0x80 ? 3 * 2 ** ((bytes[10] & 7) + 1) : 0);
    let delay = 100;
    while (offset < bytes.length) {
      const block = bytes[offset++];
      if (block === 0x3b) break;
      if (block === 0x21) {
        const label = bytes[offset++];
        if (label === 0xf9 && offset + 6 <= bytes.length) {
          const value = view.getUint16(offset + 2, true) * 10;
          delay = value < 20 ? 100 : value;
        }
      } else if (block === 0x2c) {
        if (offset + 9 > bytes.length) break;
        const flags = bytes[offset + 8];
        offset += 9 + (flags & 0x80 ? 3 * 2 ** ((flags & 7) + 1) : 0) + 1;
        delays.push(delay);
        delay = 100;
      } else break;
      while (offset < bytes.length) {
        const size = bytes[offset++];
        if (!size) break;
        offset += size;
      }
    }
  } else {
    for (let offset = format === "apng" ? 8 : 12; offset + 8 <= bytes.length;) {
      const size = view.getUint32(offset + (format === "apng" ? 0 : 4), format === "webp");
      if (format === "apng" && tag(bytes, offset + 4) === "fcTL" && offset + 34 <= bytes.length) {
        delays.push(1000 * view.getUint16(offset + 28) / (view.getUint16(offset + 30) || 100));
      }
      if (format === "webp" && tag(bytes, offset) === "ANMF" && offset + 24 <= bytes.length) {
        delays.push(bytes[offset + 20] | bytes[offset + 21] << 8 | bytes[offset + 22] << 16);
      }
      offset += format === "apng" ? size + 12 : size + 8 + size % 2;
    }
  }
  return delays;
}

export function animationDurationMilliseconds(bytes: Uint8Array, format: PortraitAnimationFormat): number {
  return Math.round(animationFrameDelaysMilliseconds(bytes, format).reduce((sum, delay) => sum + delay, 0));
}

export function portraitAnimationDimensions(bytes: Uint8Array, format: PortraitAnimationFormat): { width: number; height: number; frames: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const invalid = () => {
    throw new Error("The animation is incomplete or invalid.");
  };
  if (format === "gif") {
    if (bytes.length < 13 || !tag(bytes, 0, 6).startsWith("GIF8")) return invalid();
    const width = view.getUint16(6, true), height = view.getUint16(8, true);
    let offset = 13 + (bytes[10] & 0x80 ? 3 * 2 ** ((bytes[10] & 7) + 1) : 0);
    let frames = 0;
    while (offset < bytes.length) {
      const block = bytes[offset++];
      if (block === 0x3b) break;
      if (block === 0x2c) {
        if (offset + 9 > bytes.length) return invalid();
        const flags = bytes[offset + 8];
        offset += 9 + (flags & 0x80 ? 3 * 2 ** ((flags & 7) + 1) : 0) + 1;
        frames++;
      } else if (block === 0x21) offset++;
      else return invalid();
      while (offset < bytes.length) {
        const size = bytes[offset++];
        if (!size) break;
        offset += size;
        if (offset > bytes.length) return invalid();
      }
    }
    if (!width || !height || !frames || offset > bytes.length) return invalid();
    return { width, height, frames };
  }
  let width = 0, height = 0, frames = 0;
  const little = format === "webp";
  if (little ? tag(bytes, 0) !== "RIFF" || tag(bytes, 8) !== "WEBP" : tag(bytes, 1, 3) !== "PNG") return invalid();
  for (let offset = little ? 12 : 8; offset + 8 <= bytes.length;) {
    const size = view.getUint32(offset + (little ? 4 : 0), little);
    const end = offset + size + (little ? 8 + size % 2 : 12);
    if (end > bytes.length) return invalid();
    const name = tag(bytes, offset + (little ? 0 : 4));
    if (little && name === "VP8X" && size >= 10) {
      width = 1 + (bytes[offset + 12] | bytes[offset + 13] << 8 | bytes[offset + 14] << 16);
      height = 1 + (bytes[offset + 15] | bytes[offset + 16] << 8 | bytes[offset + 17] << 16);
    } else if (!little && name === "IHDR" && size >= 13) {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
    }
    if (name === (little ? "ANMF" : "fcTL")) frames++;
    offset = end;
  }
  if (!width || !height || !frames) return invalid();
  return { width, height, frames };
}
