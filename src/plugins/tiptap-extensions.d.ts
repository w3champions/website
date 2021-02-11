// see: https://gist.github.com/grindpride/e436290d359b6da878b320b8ebf33446
declare module 'tiptap-extensions' {
  import { Extension, Node, Mark, Editor } from 'tiptap';
  import { Plugin } from 'prosemirror-state';

  export class Blockquote extends Node {}

  export class BulletList extends Node {}

  export class Code extends Node {}

  export class CodeBlock extends Node {}

  export class CodeBlockHighlight extends Node {}

  export class HardBreak extends Node {}

  export interface HeadingOptions {
    /** Specifies which headlines are to be supported. */
    levels?: number[];
  }
  export class Heading extends Node {
    constructor(options?: HeadingOptions);
  }

  export class HorizontalRule extends Node {}

  export class Image extends Node {}

  export interface LinkOptions {
    /** Specifies if links will be opened on click. */
    openOnClick?: boolean;
  }
  export class Link extends Node {
    constructor(options?: LinkOptions);
  }

  export class ListItem extends Node {}

  export class Mention extends Node {}

  export class OrderedList extends Node {}

  export interface TableOptions {
    /** Enables the resizing of columns. */
    resizable?: boolean;
  }
  export class Table extends Node {
    constructor(options?: TableOptions);
  }

  export class TableCell extends Node {}

  export class TableRow extends Node {}

  export class TableHeader extends Node {}

  export interface TodoItemOptions {
    /** Specifies if you can nest todo lists. */
    nested?: boolean;
  }
  export class TodoItem extends Extension {
    constructor(options?: TodoItemOptions);
  }

  export class TodoList extends Node {}

  export class Bold extends Mark {}

  export class Italic extends Mark {}

  export class Strike extends Mark {}

  export class Underline extends Mark {}

  export interface CollabSendableParam {
    editor: Editor;
    sendable: {
      version: number;
      steps: Record<string, any>[];
      clientID: number | string;
    };
  }
  export interface CollabStep {
    step: Record<string, any>;
    clientID: number | string;
    version: number;
  }
  export interface CollabUpdateParam {
    steps: CollabStep[];
    version: number;
  }
  export interface CollaborationOptions {
    version?: number;
    clientID?: number | string;
    debounce?: number;
    onSendable?: (param: CollabSendableParam) => void;
    update?: (param: CollabUpdateParam) => void;
  }
  export class Collaboration extends Extension {
    constructor(options?: CollaborationOptions);
  }

  export interface FocusOptions {
    className?: string;
    nested?: boolean;
  }
  export class Focus extends Extension {
    constructor(options?: FocusOptions);
  }

  export interface HistoryOptions {
    autoSelectNext?: boolean;
    findClass?: string;
    searching?: boolean;
    caseSensitive?: boolean;
    disableRegex?: boolean;
    alwaysSearch?: boolean;
  }
  export class History extends Extension {
    constructor(options?: HistoryOptions);
  }

  export interface PlaceholderOptions {
    emptyEditorClass: string;
    emptyNodeClass?: string;
    emptyNodeText?: string | ((node: Node) => string);
    showOnlyWhenEditable?: boolean;
    showOnlyCurrent?: boolean;
  }
  export class Placeholder extends Extension {
    constructor(options?: PlaceholderOptions);
  }

  export interface SearchOptions {
    depth?: string;
    newGroupDelay?: string;
  }
  export class Search extends Extension {
    constructor(options?: SearchOptions);
  }

  export interface TrailingNodeOptions {
    /**
     * Node to be at the end of the document
     *
     * defaults to 'paragraph'
     */
    node?: string;
    /**
     * The trailing node will not be displayed after these specified nodes.
     */
    notAfter?: string[];
  }
  export class TrailingNode extends Extension {
    constructor(options?: TrailingNodeOptions);
  }

  export interface SuggestionsOptions<T = any> {
    matcher?: {
      char: string;
      allowSpaces: boolean;
      startOfLine: boolean;
    };
    appendText?: null;
    suggestionClass?: string;
    command?: () => boolean;
    items?: T[];
    onEnter?: () => boolean;
    onChange?: () => boolean;
    onExit?: () => boolean;
    onKeyDown?: () => boolean;
    onFilter?: <T>(searchItems: T[], query?: string) => T[];
  }
  export type Suggestions<Item> = (options: SuggestionsOptions<Item>) => Plugin;

  export type Highlight = (options: { name: string }) => Plugin;
}