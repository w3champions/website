export interface Wc3TextSegment {
  text: string;
  color?: string;
}

const HEX = /^[0-9a-fA-F]{8}$/;

/**
 * Splits Warcraft 3 markup into plain segments and coloured ones.
 *
 * Map authors write colours as `|cAARRGGBB text |r`, where the first byte is
 * alpha (almost always 00 or ff) and the rest is the colour. `|n` is a line
 * break and `||` an escaped pipe. Anything else after a pipe is left as typed.
 */
export function parseWc3Text(input?: string): Wc3TextSegment[] {
  if (!input) return [];

  const segments: Wc3TextSegment[] = [];
  let buffer = "";
  let color: string | undefined;
  let index = 0;

  function flush(): void {
    if (!buffer) return;
    segments.push(color ? { text: buffer, color } : { text: buffer });
    buffer = "";
  }

  while (index < input.length) {
    const character = input[index];

    if (character !== "|" || index === input.length - 1) {
      buffer += character;
      index++;
      continue;
    }

    const marker = input[index + 1].toLowerCase();

    if (marker === "c" && HEX.test(input.slice(index + 2, index + 10))) {
      flush();
      // Drop the alpha byte; the palette is what matters here.
      color = `#${input.slice(index + 4, index + 10)}`;
      index += 10;
      continue;
    }

    if (marker === "r") {
      flush();
      color = undefined;
      index += 2;
      continue;
    }

    if (marker === "n") {
      buffer += "\n";
      index += 2;
      continue;
    }

    if (marker === "|") {
      buffer += "|";
      index += 2;
      continue;
    }

    buffer += character;
    index++;
  }

  flush();
  return segments;
}

/** The same text with every colour code removed, for places that need a plain string. */
export function stripWc3Text(input?: string): string {
  return parseWc3Text(input).map((segment) => segment.text).join("");
}
