// The update service records a stored map file's `metaData.sha1`, which the map
// parser computes over the complete archive (flo's w3map checksum streams the
// whole file through SHA-1). Hashing the picked file the same way is what lets
// the bulk upload tell "the identical file is already stored" apart from "a
// different file happens to have this name".
//
// `crypto.subtle` needs a secure context, which the admin panel always is
// (https, or localhost during development).
export async function sha1Hex(blob: Blob): Promise<string> {
  if (!crypto?.subtle) {
    throw new Error("Hashing map files needs a secure page (https, or localhost during development).");
  }

  const digest = await crypto.subtle.digest("SHA-1", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
