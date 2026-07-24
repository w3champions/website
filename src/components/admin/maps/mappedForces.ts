import type { MapForce } from "@/store/admin/mapsManagement/types";

export type ForcesFailure = { message: string; path?: string; line?: number; column?: number };

export type ParsedMappedForces =
  | { forces: MapForce[]; error?: undefined }
  | { forces?: undefined; error: ForcesFailure };

/** A failure resolved against the text it came from, ready to show to the user. */
export type ResolvedFailure = { message: string; line: number | null; column: number | null };

// Shape failures carry a path rather than a line; the line is resolved later, against the
// text, by indexPathLines. Parse failures come from describeParseError instead.
function fail(message: string, path: string): ParsedMappedForces {
  return { error: { message, path } };
}

// dprint's preferDouble and ESLint's unconditional double quotes cannot both be satisfied
// for a double-quote character, so the scanner compares code points for those two.
const QUOTE = 34;
const BACKSLASH = 92;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// V8 and Firefox both name the line in the message, so prefer that and fall back to
// counting newlines up to a reported offset. Safari gives neither, leaving nothing to
// point at. The positional tail is stripped so it is not repeated beside the line and
// column we render ourselves.
export function describeParseError(message: string, text: string): ForcesFailure {
  const lineAndColumn = /line (\d+) column (\d+)/i.exec(message);
  const position = /position (\d+)/i.exec(message);

  let line: number | undefined;
  if (lineAndColumn) line = Number(lineAndColumn[1]);
  else if (position) line = text.slice(0, Number(position[1])).split("\n").length;

  const tidied = message
    .replace(/\s*in JSON at position \d+(?:\s*\(line \d+ column \d+\))?\.?/i, "")
    .replace(/\s*at line \d+ column \d+ of the JSON data\.?/i, "")
    .replace(/^JSON\.parse:\s*/i, "")
    .trim();

  return {
    message: tidied || message,
    line,
    column: lineAndColumn ? Number(lineAndColumn[2]) : undefined,
  };
}

// Records the 1-based line on which each value begins, keyed by the same path syntax the
// validator reports, so a shape error can name a line whatever the formatting. Assumes
// the text has already parsed cleanly, so it only has to walk well-formed JSON.
export function indexPathLines(text: string): Record<string, number> {
  const lines: Record<string, number> = {};
  let at = 0;
  let line = 1;

  function skipWhitespace() {
    while (at < text.length) {
      const char = text[at];
      if (char === "\n") line++;
      else if (char !== " " && char !== "\t" && char !== "\r") break;
      at++;
    }
  }

  // Leaves `at` just past the closing quote. JSON forbids raw newlines in strings, so
  // this cannot move `line`.
  function readString() {
    at++;
    while (at < text.length) {
      const code = text.charCodeAt(at);
      if (code === BACKSLASH) {
        at += 2;
        continue;
      }
      at++;
      if (code === QUOTE) return;
    }
  }

  function readValue(path: string) {
    skipWhitespace();
    lines[path] = line;

    const char = text[at];
    if (text.charCodeAt(at) === QUOTE) {
      readString();
      return;
    }

    if (char === "{") {
      at++;
      skipWhitespace();
      if (text[at] === "}") {
        at++;
        return;
      }
      for (;;) {
        skipWhitespace();
        const keyStart = at;
        readString();
        const key = JSON.parse(text.slice(keyStart, at)) as string;
        skipWhitespace();
        at++; // colon
        readValue(`${path}.${key}`);
        skipWhitespace();
        if (text[at] === ",") {
          at++;
          continue;
        }
        at++; // closing brace
        return;
      }
    }

    if (char === "[") {
      at++;
      skipWhitespace();
      if (text[at] === "]") {
        at++;
        return;
      }
      let index = 0;
      for (;;) {
        readValue(`${path}[${index++}]`);
        skipWhitespace();
        if (text[at] === ",") {
          at++;
          continue;
        }
        at++; // closing bracket
        return;
      }
    }

    // number, true, false or null
    while (at < text.length && !",]} \t\r\n".includes(text[at])) at++;
  }

  readValue("forces");
  return lines;
}

// mappedForces gets no server-side validation: the matchmaking service's rule is
// spelled "mappedforces" and so never matches the field. Validate the shape the
// backend would fail to deserialize, and leave the meaning of colors/races to it.
export function parseMappedForces(text: string): ParsedMappedForces {
  if (!text.trim()) return { forces: [] };

  let parsed: unknown;
  try {
    // Parse the raw text, not a trimmed copy, so reported offsets line up with the gutter.
    parsed = JSON.parse(text);
  } catch (err) {
    return { error: describeParseError(err instanceof Error ? err.message : "Invalid JSON.", text) };
  }

  if (!Array.isArray(parsed)) return fail("Must be a JSON array of forces, e.g. [].", "forces");

  for (let i = 0; i < parsed.length; i++) {
    const force: unknown = parsed[i];
    const at = `forces[${i}]`;

    if (!isPlainObject(force)) return fail(`${at}: must be an object.`, at);
    if (!isFiniteNumber(force.team)) return fail(`${at}: "team" must be a number.`, at);
    if (!Array.isArray(force.slots)) return fail(`${at}: "slots" must be an array.`, at);

    const slots: unknown[] = force.slots;
    for (let s = 0; s < slots.length; s++) {
      const slot: unknown = slots[s];
      const slotAt = `${at}.slots[${s}]`;

      if (!isPlainObject(slot)) return fail(`${slotAt}: must be an object like { "index": 0 }.`, slotAt);
      if (!isFiniteNumber(slot.index)) return fail(`${slotAt}: "index" must be a number.`, slotAt);
      // Color is int? on the backend and absent on the matchmaking service side, so a
      // slot with no color reaches us as null. Treat null and absent alike.
      if (slot.color !== undefined && slot.color !== null && !isFiniteNumber(slot.color)) {
        return fail(`${slotAt}: "color" must be a number or null.`, slotAt);
      }
    }

    if (force.computers !== undefined) {
      if (!Array.isArray(force.computers)) return fail(`${at}: "computers" must be an array.`, at);

      const computers: unknown[] = force.computers;
      for (let c = 0; c < computers.length; c++) {
        const computer: unknown = computers[c];
        const computerAt = `${at}.computers[${c}]`;

        if (!isPlainObject(computer)) return fail(`${computerAt}: must be an object.`, computerAt);
        for (const key of ["slot", "color", "race", "difficulty"]) {
          if (!isFiniteNumber(computer[key])) {
            return fail(`${computerAt}: "${key}" must be a number.`, computerAt);
          }
        }
      }
    }
  }

  return { forces: parsed as MapForce[] };
}

/**
 * Pins a failure to a line. A parse failure already carries one; a shape failure carries a
 * path, which only resolves because the text is known to have parsed.
 */
export function resolveFailure(failure: ForcesFailure, text: string): ResolvedFailure {
  let line = failure.line ?? null;
  if (line === null && failure.path) {
    line = indexPathLines(text)[failure.path] ?? null;
  }

  return { message: failure.message, line, column: failure.column ?? null };
}

/** Renders a resolved failure as the single line of text shown beneath the editor. */
export function describeFailure(failure: ResolvedFailure): string {
  if (!failure.line) return failure.message;

  const at = failure.column ? `line ${failure.line}, column ${failure.column}` : `line ${failure.line}`;
  return `${at} — ${failure.message}`;
}

/** Summarises valid content for the hint line. */
export function summariseForces(forces: MapForce[]): string {
  if (!forces.length) return "No forces mapped. Leave empty for maps that don't force a lobby layout.";

  const slotCount = forces.reduce((total, force) => total + (force.slots?.length ?? 0), 0);
  return `${forces.length} force(s), ${slotCount} slot(s).`;
}
