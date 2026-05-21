export interface IBinData {
  $binary: { base64: string };
}

function base64ToBytes(b64: string): Uint8Array {
  if (b64.length === 0) return new Uint8Array(0);
  const binStr = atob(b64);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes;
}

export function decodeU8(bin: IBinData): Uint8Array {
  return base64ToBytes(bin.$binary.base64);
}

export function decodeU16LE(bin: IBinData): Uint16Array {
  const bytes = base64ToBytes(bin.$binary.base64);
  if (bytes.byteLength % 2 !== 0) {
    throw new Error(`decodeU16LE: byte length ${bytes.byteLength} is not divisible by 2`);
  }
  return new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
}

export function decodeU32LE(bin: IBinData): Uint32Array {
  const bytes = base64ToBytes(bin.$binary.base64);
  if (bytes.byteLength % 4 !== 0) {
    throw new Error(`decodeU32LE: byte length ${bytes.byteLength} is not divisible by 4`);
  }
  return new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}
