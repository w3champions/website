export interface InlineSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  /** Set on Han runs so they are announced and rendered in Chinese inside other-language text. */
  lang?: string;
}

const HAN_RUN = /(\p{Script=Han}+)/u;
const CHINESE_LANG = "zh-Hans";

const INLINE_TOKEN = /(\*\*(?=\S)[^*]+?(?<=\S)\*\*|\*(?=\S)[^*]+?(?<=\S)\*)/;

/** Splits `**bold**` / `*italic*` markup into renderable segments. */
export function parseInline(source: string): InlineSegment[] {
  return source
    .split(INLINE_TOKEN)
    .filter((part) => part.length > 0)
    .flatMap((part): InlineSegment[] => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return [{ text: part.slice(2, -2), bold: true, italic: false }];
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return [{ text: part.slice(1, -1), bold: false, italic: true }];
      }
      return splitHan(part);
    });
}

/** Odd split indexes are the captured Han runs; a text that is only Han stays untagged. */
const splitHan = (text: string): InlineSegment[] => {
  const pieces = text.split(HAN_RUN);
  return pieces
    .map((piece, index): InlineSegment =>
      index % 2 === 1 && pieces.length > 1
        ? { text: piece, bold: false, italic: false, lang: CHINESE_LANG }
        : { text: piece, bold: false, italic: false }
    )
    .filter((segment) => segment.text.length > 0);
};

export type TemplatePart = { kind: "text"; text: string } | { kind: "token"; token: string };

const TEMPLATE_TOKEN = /\{(\w+)\}/;

/** Splits `text {token} text` templates; odd split indexes are token names. */
export function parseTemplate(source: string): TemplatePart[] {
  return source
    .split(TEMPLATE_TOKEN)
    .map((part, index): TemplatePart => index % 2 === 1 ? { kind: "token", token: part } : { kind: "text", text: part })
    .filter((part) => part.kind === "token" || part.text.length > 0);
}
