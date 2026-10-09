/**
 * Inline markup supported in every text field: `**bold**` and `*italic*`.
 * Rendered by `parseInline` (no v-html).
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] };

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
  /** Renders the section as a highlighted summary box. */
  highlight?: boolean;
}

export interface CommercialEventsContent {
  htmlLang: string;
  title: string;
  /** The bold lead line. */
  lead: string;
  intro: string;
  sections: Section[];
  faq: { title: string; items: { q: string; a: string }[] };
  contact: {
    title: string;
    intro: string;
    /** `{id}` is replaced by the WeChat ID (selectable text plus a copy button). */
    wechatLine: string;
    /** `{invite}`, `{contact}` and `{username}` are replaced by the server link, profile link and Discord username. */
    discordLine: string;
    /** UI labels for the WeChat ID copy button. */
    copy: { label: string; done: string };
  };
}
